from src.data_processing import build_tx_graph, clean_tx_data
import json
import pandas as pd
import networkx as nx

# def create_tx_graph(tx_level_data):
#     tx_level_data_clean = clean_tx_data(tx_level_data)
#     tx_graph = build_tx_graph(tx_level_data_clean)
    
#     # with open("../data/tx_graph.json", "w") as f:
#     #     json.dump(tx_graph, f, indent=2, default=str)

#     return tx_graph

def create_tx_graph(tx_level_data):
    # Initialize a graph
    G = nx.Graph()

    # Add edges from each transaction's sender and receiver
    for _, row in tx_level_data.iterrows():
        sender = row['sender']
        receiver = row['receiver']
        G.add_edge(sender, receiver)

    # Extract connected components as clusters
    clusters = list(nx.connected_components(G))

    # Prepare the cluster data
    cluster_data = []
    for cluster_id, wallets in enumerate(clusters):
        # Filter transactions involving cluster wallets
        mask = tx_level_data['sender'].isin(wallets) | tx_level_data['receiver'].isin(wallets)
        cluster_txs = tx_level_data[mask]
        #cluster_txs = tx_level_data['signature'].nunique()
        unique_entities = cluster_txs['entity_label'].dropna().unique().tolist()

        # Optionally infer cluster type based on entities present
        if len(unique_entities) == 1:
            cluster_type = unique_entities[0]
        elif len(unique_entities) == 0:
            cluster_type = "Unknown"
        else:
            cluster_type = "Mixed"


        # Aggregate metrics
        cluster_entry = {
            'cluster_id': cluster_id,
            'wallets_in_cluster': list(wallets),
            'total_transactions': cluster_txs['signature'].nunique(),
            'cluster_start_time': cluster_txs['timestamp'].min(),
            'cluster_end_time': cluster_txs['timestamp'].max(),
            'cluster_size': len(wallets),
            'cluster_type': cluster_type  # Placeholder for further analysis
        }
        cluster_data.append(cluster_entry)

    # Create the DataFrame
    cluster_df = pd.DataFrame(cluster_data)[
        ['cluster_id', 'wallets_in_cluster', 'total_transactions',
        'cluster_start_time', 'cluster_end_time', 'cluster_size', 'cluster_type']
    ]

    # Add graph metrics to each cluster
    for cluster in cluster_data:
        wallets = cluster['wallets_in_cluster']
        subgraph = G.subgraph(wallets)
        
        degrees = dict(subgraph.degree())
        avg_degree = sum(degrees.values()) / len(degrees)
        
        # Degree centrality
        central_wallets = sorted(degrees.items(), key=lambda x: x[1], reverse=True)[:3]
        central_wallets = [wallet for wallet, _ in central_wallets]
        
        cluster['avg_degree'] = avg_degree
        cluster['density'] = nx.density(subgraph)
        cluster['central_wallets'] = central_wallets

    # Define thresholds
    high_density_threshold = 0.3
    small_cluster_threshold = 5
    high_tx_rate_threshold = 5  # transactions per wallet
    high_centrality_ratio = 0.5  # one wallet handles >50% of edges

    for cluster in cluster_data:
        flags = []

        # High density + small cluster (potential wash trading or bot rings)
        if cluster['density'] > high_density_threshold and cluster['cluster_size'] < small_cluster_threshold:
            flags.append('Dense Small Cluster')

        # High transaction rate
        tx_rate = cluster['total_transactions'] / cluster['cluster_size']
        if tx_rate > high_tx_rate_threshold:
            flags.append('High Tx Rate')

        # Check for centralization
        wallets = cluster['wallets_in_cluster']
        subgraph = G.subgraph(wallets)
        degrees = dict(subgraph.degree())
        max_deg = max(degrees.values())
        if max_deg / (2 * cluster['total_transactions']) > high_centrality_ratio:
            flags.append('Centralized Flow')

        cluster['flags'] = flags if flags else ['Normal']

        final_cluster_df = pd.DataFrame(cluster_data)[
        ['cluster_id', 'wallets_in_cluster', 'total_transactions',
        'cluster_start_time', 'cluster_end_time', 'cluster_size',
        'cluster_type', 'avg_degree', 'density', 'central_wallets', 'flags']
    ]

    print(final_cluster_df.head())

    return cluster_data
