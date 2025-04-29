from flask import Flask, render_template, request, jsonify
from src.clustering import create_tx_graph
from src.data_fetching import get_balance_data
from src.data_processing import (get_comprehensive_tx_history, construct_tx_dataset, 
                                 get_summary_stats, jsonify_safe, merge_datasets)
from src.entity_labeling import add_entity_labels
from src.wallet_analysis import WalletAnalysis
import os
import json
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

HELIUS_API_KEY = os.getenv('HELIUS_API_KEY')

use_cache = True # For testing
test_address = 'AGPZnBZUxmhAtcp8XjT4n8bCia9dEYhhm16M2sfFvmTU'

ROOT_DIR = os.getcwd()
DATA_DIR = os.path.join(ROOT_DIR, 'data', 'processed', 'backend_response.json')

def create_app():
    app = Flask(__name__)

    @app.route('/')
    def home():
        return "App is running"
    
    @app.route('/api/analyze_address', methods=['POST'])
    def analyze_address():
        data = request.get_json()
        address = data.get('address')

        if address is not test_address:
            address = test_address

        #Should do further validation that address is valid solana address

        if not address:
            return jsonify({"error": "Must Pass Address"}), 400
        
        try:
            parsed_transaction_history = get_comprehensive_tx_history(address, HELIUS_API_KEY, use_cache=use_cache)
        except Exception as e:
            print(f'e: {e}')
            return jsonify({"error": str(e)}), 500
        
        try:
            balance_df = get_balance_data(address) # for now it returns CSV data for test_address
        except Exception as e:
            print(f'e: {e}')
            return jsonify({"error": str(e)}), 500
        
        tx_level_data = construct_tx_dataset(parsed_transaction_history,address,balance_df)

        print(f'tx_level_data after construct dataset: {tx_level_data}')

        tx_level_data_complete, wallet_stats = add_entity_labels(tx_level_data, address) # turn to dict

        print(f'tx_level_data_complete after entity labeling: {tx_level_data_complete}')
        print(f'wallet_stats: {wallet_stats}')

        tx_level_data_complete = merge_datasets(tx_level_data_complete, wallet_stats)

        tx_graph = create_tx_graph(tx_level_data_complete)

        print(F'tx_graph: {tx_graph}')

        wallet_analysis_df = get_summary_stats(tx_level_data_complete, address)

        print(f'wallet_analysis_df: {wallet_analysis_df}')

        wallet_analysis_obj = WalletAnalysis(wallet_analysis_df)

        funding_sources = wallet_analysis_obj.track_funding_sources_and_flow(address).astype(object).where(pd.notnull).to_dict(orient='records')

        print("Funding Sources and Asset Flow:") 
        print(funding_sources)

        transaction_history = wallet_analysis_obj.transaction_history(address)
        print("\nTransaction History:")
        print(transaction_history)

        activity_patterns = wallet_analysis_obj.key_activity_patterns_and_risk_factors(address)
        print("\nActivity Patterns and Risk Factors:")
        print(activity_patterns)

        #Where do we add wallet analysis?

        print('funding_sources', type(funding_sources))
        print('transaction_history', type(transaction_history))
        print('activity_patterns', type(activity_patterns))

        complete_wallet_analysis = {
            'funding_sources':funding_sources,
            'transaction_history': transaction_history,
            'activity_patterns':activity_patterns
        }

        results = {
            'wallet_analysis': complete_wallet_analysis,
            'tx_graph': tx_graph
        }

        print('complete_wallet_analysis', type(complete_wallet_analysis))
        print('tx_graph', type(tx_graph))
        print('results', type(results))

        json_results = jsonify_safe(results)

        with open(DATA_DIR, 'w') as f:
            json.dump(json_results, f)

        return jsonify(json_results)
    
    return app
        
if __name__ == "__main__":
    print('Starting Flask app...')
    app = create_app()
    app.run(debug=True, use_reloader=False, port=5025) #use a different port?