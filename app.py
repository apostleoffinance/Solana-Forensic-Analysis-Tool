from flask import Flask, render_template, request, jsonify
from src.clustering import create_tx_graph
from src.data_fetching import get_balance_data,flipside_api_results, get_price_data
from src.data_processing import (get_comprehensive_tx_history, construct_tx_dataset, 
                                 get_summary_stats, jsonify_safe, merge_datasets)
from src.entity_labeling import add_entity_labels
from src.wallet_analysis import WalletAnalysis

from concurrent.futures import ThreadPoolExecutor

import os
import json
import time
import pandas as pd
from dotenv import load_dotenv
import uuid

load_dotenv()

HELIUS_API_KEY = os.getenv('HELIUS_API_KEY')

use_cache = False # For testing
test_address = 'AGPZnBZUxmhAtcp8XjT4n8bCia9dEYhhm16M2sfFvmTU'

ROOT_DIR = os.getcwd()
DATA_DIR = os.path.join(ROOT_DIR, 'data', 'processed', 'backend_response.json')

def retry_call(fn, retries=3, delay=2, *args, **kwargs):
    last_exception = None
    for attempt in range(retries):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            print(f"[Retry {attempt+1}/{retries}] {fn.__name__} failed: {e}")
            last_exception = e
            time.sleep(delay)
    raise last_exception

def run_analysis_logic(address, job_id):
    try:
        print(f'running analysis for {address}')
        print(f'Getting Parsed History')
        parsed_transaction_history = retry_call(get_comprehensive_tx_history, 3, 2, address, HELIUS_API_KEY, use_cache=use_cache)
        print(f'Getting Balance Data')
        balance_df = retry_call(get_balance_data, 3, 2, address, use_cache=use_cache)
        token_portfolio = balance_df['MINT'].unique()
        start_date = pd.to_datetime(balance_df['BLOCK_TIMESTAMP'].min()).strftime('%Y-%m-%d %H:%M:%S')
        print(f'Getting Price Data')
        prices_data = retry_call(get_price_data, 3, 2, token_portfolio, start_date, use_cache=use_cache)
        print(f'Constructing Dataset')
        tx_level_data = construct_tx_dataset(parsed_transaction_history, prices_data, address, balance_df)
        print(f'Adding labels')
        tx_level_data_complete, wallet_stats = add_entity_labels(tx_level_data, address)
        tx_level_data_complete = merge_datasets(tx_level_data_complete, wallet_stats)
        print(f'Creating tx graph')
        tx_graph = create_tx_graph(tx_level_data_complete)
        print(f'Getting summary stats')
        wallet_analysis_df = get_summary_stats(tx_level_data_complete, address)
        wallet_analysis_obj = WalletAnalysis(wallet_analysis_df)

        funding_sources = wallet_analysis_obj.track_funding_sources_and_flow(address).astype(object).where(pd.notnull).to_dict(orient='records')
        transaction_history = wallet_analysis_obj.transaction_history(address)
        activity_patterns = wallet_analysis_obj.key_activity_patterns_and_risk_factors(address)

        complete_wallet_analysis = {
            'funding_sources': funding_sources,
            'transaction_history': transaction_history,
            'activity_patterns': activity_patterns
        }

        results = {
            'wallet_analysis': complete_wallet_analysis,
            'tx_graph': tx_graph
        }

        print(f'Writing results to {job_id}.json')

        json_results = jsonify_safe(results)

        # Save result to per-job file
        job_path = os.path.join('jobs', 'processed', f'{job_id}.json')
        with open(job_path, 'w') as f:
            json.dump(json_results, f)

    except Exception as e:
        print(f'[Threaded Analysis Error]: {e}')
        # Save error so frontend knows it failed
        error_path = os.path.join('jobs', 'processed', f'{job_id}_error.txt')
        with open(error_path, 'w') as f:
            f.write(str(e))

def create_app():
    app = Flask(__name__)

    executor = ThreadPoolExecutor(max_workers=4) 

    @app.route('/')
    def home():
        return "App is running"
    
    @app.route('/api/analyze_address', methods=['POST'])
    def analyze_address():
        data = request.get_json()
        address = data.get('address')

        if not address:
            return jsonify({"error": "Must Pass Address"}), 400

        job_id = address
        result_path = os.path.join('jobs', 'processed', f'{job_id}.json')
        error_path = os.path.join('jobs', 'processed', f'{job_id}_error.txt')

        # If cached result exists, return it immediately
        if os.path.exists(result_path):
            with open(result_path) as f:
                result = json.load(f)
            return jsonify(result), 200

        # If a previous error occurred, return it
        if os.path.exists(error_path):
            with open(error_path) as f:
                error_msg = f.read()
            return jsonify({"error": error_msg}), 500

        # If not cached, start new analysis in background
        executor.submit(run_analysis_logic, address, job_id)
        return jsonify({
            "status": "processing",
            "job_id": job_id,
            "message": f"Started analysis for {address}"
        }), 202

    @app.route('/api/get_results', methods=['GET'])
    def get_results():
        job_id = request.args.get('job_id')
        if not job_id:
            return jsonify({"error": "Missing job_id"}), 400

        result_path = os.path.join('jobs', 'processed', f'{job_id}.json')
        error_path = os.path.join('jobs', 'processed', f'{job_id}_error.txt')

        if os.path.exists(result_path):
            with open(result_path) as f:
                result = json.load(f)
            return jsonify(result)

        elif os.path.exists(error_path):
            with open(error_path) as f:
                error_msg = f.read()
            return jsonify({"error": error_msg}), 500

        else:
            return jsonify({"status": "processing"}), 202
    
    @app.route('/api/clear_cache', methods=['GET'])
    def clear_cache():
        cleared = []
        errors = []
        cache_path = os.path.join('jobs', 'processed')

        for filename in os.listdir(cache_path):
            file_path = os.path.join(cache_path, filename)
            try:
                if os.path.isfile(file_path):
                    os.remove(file_path)
                    cleared.append(filename)
            except Exception as e:
                print(f"Error deleting file {file_path}: {e}")
                errors.append({"file": filename, "error": str(e)})

        return jsonify({
            "status": "cache_cleared",
            "files_deleted": cleared,
            "errors": errors
        }), 200

    return app
        
if __name__ == "__main__":
    print('Starting Flask app...')
    app = create_app()
    app.run(host="0.0.0.0", debug=True, port=5025)