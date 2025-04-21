from flask import Flask, render_template, request, jsonify
from src.clustering import create_tx_graph
from src.data_fetching import get_balance_data
from src.data_processing import get_comprehensive_tx_history, construct_tx_dataset 
from src.entity_labeling import add_entity_labels
import os
from dotenv import load_dotenv

load_dotenv()

HELIUS_API_KEY = os.getenv('HELIUS_API_KEY')

use_cache = True # For testing
test_address = 'AGPZnBZUxmhAtcp8XjT4n8bCia9dEYhhm16M2sfFvmTU'

def create_app():
    app = Flask(__name__)

    @app.route('/')
    def home():
        return print('running app')
    
    @app.route('/analyze_address', methods=['POST'])
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

        breakpoint()

        tx_level_data_complete = add_entity_labels(tx_level_data, address)

        print(f'tx_level_data_complete after entity labeling: {tx_level_data_complete}')

        breakpoint()

        tx_graph = create_tx_graph(tx_level_data_complete)

        print(F'tx_graph: {tx_graph}')

        breakpoint()

        #Where do we add wallet analysis?

        # Not sure what we should return?  jsonified tx_graph?
        return jsonify({'tx_graph':tx_graph})
    
    return app
        
if __name__ == "__main__":
    print('Starting Flask app...')
    app = create_app()
    app.run(debug=True, use_reloader=False, port=5025) #use a different port?