from src.data_processing import build_tx_graph, clean_tx_data
import json

def create_tx_graph(tx_level_data):
    tx_level_data_clean = clean_tx_data(tx_level_data)
    tx_graph = build_tx_graph(tx_level_data_clean)
    
    with open("../data/tx_graph.json", "w") as f:
        json.dump(tx_graph, f, indent=2, default=str)

    return tx_graph