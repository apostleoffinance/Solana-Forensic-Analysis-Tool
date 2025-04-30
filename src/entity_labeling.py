import requests
from dotenv import load_dotenv
import os
import pandas as pd
import time
import json

from src.data_fetching import get_vybe_identified_accounts, get_vybe_identified_programs

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # This resolves to project 
METASLEUTH_PATH = os.path.join(ROOT_DIR, 'data', 'raw', 'metasleuth_labels.json')
RAW_DATA_PATH = os.path.join(ROOT_DIR, 'data', 'raw')

# Apply labeling logic
def label_entity(row):
    if row['sent_tx_count'] > 100 and row['received_tx_count'] > 100 and (row['unique_receivers'] + row['unique_senders']) > 50:
        return 'Exchange'
    elif row['sent_tx_count'] > 50 and row['received_tx_count'] < 10 and row['unique_receivers'] > 30:
        return 'Project Wallet'
    elif row['sent_tx_count'] > 10 and row['received_tx_count'] > 10 and row['total_sent'] < 0.01:
        return 'Suspicious'
    else:
        return 'Normal User'

def load_flipside_labels():
    flipside_files = ['solana_cex_labels','solana_chadmin','solana_dapp_labels','solana_defi_labels']
    flipside_labels_df = pd.DataFrame()
    for file in flipside_files:
        dir = f'{file}.csv'
        path = os.path.join(RAW_DATA_PATH, dir)
        df = pd.read_csv(path, on_bad_lines='skip').dropna()
        flipside_labels_df = pd.concat([flipside_labels_df,df])
        flipside_labels_dict = dict(zip(flipside_labels_df['ADDRESS'], flipside_labels_df['ADDRESS_NAME']))

    return flipside_labels_dict

def load_vybe_labels():
    vybe_programs_map = get_vybe_identified_programs()
    vybe_addresses_map = get_vybe_identified_accounts()

    return vybe_programs_map, vybe_addresses_map

def get_solana_chainid(data):
    # Helper function for Metasleuth API
    for d in data['data']:
        chain_id = d.get('chain_id')
        chain_name = d.get('chain_name')

        if chain_name.lower() == 'solana':
            return {chain_id:chain_name}
        
def load_metasleuth_labels():
    with open(METASLEUTH_PATH) as f:
        solana_labels = json.load(f)
    
    entities_dict = {}

    for l in solana_labels:
        entity = l['main_entity']
        address = l['address']

        entities_dict[address] = entity

    return entities_dict

def classify_category(entity):
    entity = entity.lower()

    # Exchanges
    if any(keyword in entity for keyword in ['openbook', 'raydium', 'orca', 'jupiter', 'meteora', 'coinbase']):
        return 'Exchange'

    # NFT Traders or Platforms
    if any(keyword in entity for keyword in ['magic eden', 'nft', 'digitaleyes', 'tensor']):
        return 'NFT Trader'

    # Rug pulls (hardcoded suspicious names or memes)
    if any(keyword in entity for keyword in ['rug', 'bricked', 'scam', 'meme']):
        return 'Rug Pull'
    
    if any(keyword in entity for keyword in ['allbridge']):
        return 'Bridge'
    
    if any(keyword in entity for keyword in ['airdrop','pengu']):
        return 'Airdrop'

    # DeFi protocols
    if any(keyword in entity for keyword in ['uxd', 'usdh', 'softt', 'vault', 'solend', 'lending','lend','kamino','parcl']):
        return 'DeFi Protocol'

    # Default fallback
    return 'Other'

def add_entity_labels(df_og, address):

    df = df_og.copy()

    flipside_labels_dict = load_flipside_labels()
    vybe_programs_map, vybe_addresses_map = load_vybe_labels()
    entities_dict = load_metasleuth_labels()

    # Normalize mapping keys
    vybe_programs_map = {k.lower(): v for k, v in vybe_programs_map.items()}
    vybe_addresses_map = {k.lower(): v for k, v in vybe_addresses_map.items()}
    entities_dict = {k.lower(): v for k, v in entities_dict.items()} # metasleuth
    flipside_labels_dict = {k.lower(): v for k, v in flipside_labels_dict.items()} # flipside
    combined_address_label_map = {
        **vybe_addresses_map,
        **entities_dict,
        **flipside_labels_dict
    }

    # Apply human-readable labels to tx-level DataFrame
    df['sender_name'] = df['sender'].astype(str).str.lower().map(
        lambda addr: combined_address_label_map.get(addr, 'Unknown Address'))

    df['receiver_name'] = df['receiver'].astype(str).str.lower().map(
        lambda addr: combined_address_label_map.get(addr, 'Unknown Address'))

    df['counterparty_name'] = df['counterparty'].astype(str).str.lower().map(
        lambda addr: combined_address_label_map.get(addr, 'Unknown Address'))

    df['program_name'] = df['program_id'].astype(str).str.lower().map(
        lambda pid: vybe_programs_map.get(pid, 'Unknown Program'))
    
    df['sender_category'] = df['sender_name'].apply(classify_category)
    df['receiver_category'] = df['receiver_name'].apply(classify_category)
    df['program_category'] = df['program_name'].apply(classify_category)
    
    df['wallet_entity_label'] = combined_address_label_map.get(address.lower(), 'Unknown Entity')

    # Group by sender and receiver to get wallet behaviors
    send_stats = df[df['direction'] == 'sent'].groupby('sender').agg({
        'token_amount': 'sum',
        'signature': 'count',
        'receiver_name': pd.Series.nunique
    }).rename(columns={
        'token_amount': 'total_sent',
        'signature': 'sent_tx_count',
        'receiver_name': 'unique_receivers'
    })

    receive_stats = df[df['direction'] == 'received'].groupby('sender').agg({
        'token_amount': 'sum',
        'signature': 'count',
        'receiver_name': pd.Series.nunique
    }).rename(columns={
        'token_amount': 'total_received',
        'signature': 'received_tx_count',
        'receiver_name': 'unique_senders'
    })

    # Combine both
    wallet_stats = send_stats.join(receive_stats, how='outer').fillna(0)

    wallet_stats['entity_label'] = wallet_stats.apply(label_entity, axis=1)

    labeled_entities_df = wallet_stats.reset_index().rename(columns={'sender': 'wallet_address'})

    return df, labeled_entities_df



