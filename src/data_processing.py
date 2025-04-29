import pandas as pd
import numpy as np
import json
from src.data_fetching import get_all_signatures, v0_transactions_all, get_price_data
from src.metadata import LAMPORT_SCALE, WRAPPED_SOL, NATIVE_SOL
import os

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # This resolves to project root
TEST_TX_PATH = os.path.join(ROOT_DIR, 'data', 'raw', 'test_tx_history.json')

def clean_tx_data(df):
    df = df.copy()  # Avoid SettingWithCopyWarning

    # Fill missing columns
    default_columns = [
        'sender_name', 'receiver_name', 'counterparty_name', 
        'wallet_entity_label', 'program_name'
    ]
    for col in default_columns:
        if col not in df.columns:
            df[col] = 'Unknown Address' if col != 'program_name' else 'Unknown Program'

    # Only apply fallback logic if 'wallet' column exists
    if 'wallet' in df.columns:
        df.loc[:, 'sender_name'] = np.where(
            df['sender'].isin(df['wallet'].values),
            df['wallet_entity_label'],
            df['sender_name']
        )

        df.loc[:, 'receiver_name'] = np.where(
            df['receiver'].isin(df['wallet'].values),
            df['wallet_entity_label'],
            df['receiver_name']
        )

        df.loc[:, 'counterparty_name'] = np.where(
            df['counterparty'].isin(df['wallet'].values),
            df['wallet_entity_label'],
            df['counterparty_name']
        )

    # Convert timestamp to datetime
    if 'timestamp' in df.columns:
        df.loc[:, 'timestamp'] = pd.to_datetime(df['timestamp'])

    return df

def build_tx_graph(df):
    nodes = {}
    edges = []

    for _, row in df.iterrows():
        sender = row['sender']
        receiver = row['receiver']
        sender_label = row['sender_name']
        receiver_label = row['receiver_name']
        amount_usd = row.get('amount_usd', 0)  # Ensure amount_usd has a fallback value

        # Initialize sender node if not already present
        if sender not in nodes:
            nodes[sender] = {
                "id": sender,
                "label": sender_label,
                "amount_usd_sent": 0,
                "amount_usd_received": 0
            }

        # Initialize receiver node if not already present
        if receiver not in nodes:
            nodes[receiver] = {
                "id": receiver,
                "label": receiver_label,
                "amount_usd_sent": 0,
                "amount_usd_received": 0
            }

        # Add amount to the sender's "sent" total, ensuring no NoneType errors
        nodes[sender]["amount_usd_sent"] += amount_usd if amount_usd is not None else 0

        # Add amount to the receiver's "received" total, ensuring no NoneType errors
        nodes[receiver]["amount_usd_received"] += amount_usd if amount_usd is not None else 0

        # Add edge between sender and receiver
        edges.append({
            "from": sender,
            "to": receiver,
            "value": amount_usd if amount_usd is not None else 0
        })

    return {"nodes": nodes, "edges": edges}

def get_comprehensive_tx_history(wallet, api_key, use_cache=True):

    if use_cache:
        with open(TEST_TX_PATH) as f:
            parsed_transaction_history = json.load(f)

        return parsed_transaction_history
    
    else:

        signatures = get_all_signatures(wallet, api_key)

        signatures_dict = {}

        for sig in signatures:
            time = sig.get('blockTime')
            signature_str = sig.get('signature')

            signatures_dict[signature_str] = time
        
        signatures_array = list(signatures_dict.keys())

        parsed_transaction_history = v0_transactions_all(signatures_array, api_key)

        with open(TEST_TX_PATH, 'w') as f:
            json.dump(parsed_transaction_history, f)

        return parsed_transaction_history
    
def get_instruction_data(tx, wallet):
    instructions_data = {}

    for i in tx.get('instructions'):
        accounts = i['accounts']
        if accounts and wallet in accounts:
            data = i['data']
            program_id = i['programId']
            instructions_data['data'] = data
            instructions_data['programId'] = program_id

    return instructions_data

def summarize_transaction(tx, wallet):
    base = {
        "timestamp": tx.get("timestamp"),
        "signature": tx.get("signature"),
        "type": tx.get("type", "UNKNOWN"),
        "source": tx.get("source", "UNKNOWN"),
        "tx_status": int(tx.get("transactionError") is None),
        "block_number": tx.get("slot"),
    }

    # Track counterparties
    rows = []
    counterparties = set()

    # Native transfers
    seen_native = set()
    for t in tx.get("nativeTransfers", []):
        amount = t.get("amount", 0) / LAMPORT_SCALE
        from_user = t.get("fromUserAccount")
        to_user = t.get("toUserAccount")
        
        transfer_id = (from_user, to_user, amount)
        if transfer_id in seen_native:
            continue
        seen_native.add(transfer_id)

        if wallet in [from_user, to_user]:
            row = base.copy()
            row.update({
                "token_address": NATIVE_SOL,
                # "symbol": "SOL",
                "token_amount": amount,
                "direction": "sent" if from_user == wallet else "received",
                "sender": from_user,
                "receiver": to_user,
                "counterparty": to_user if from_user == wallet else from_user,
            })
            rows.append(row)


    # Token transfers
    for t in tx.get("tokenTransfers", []):
        try:
            amount = float(t.get("tokenAmount", 0))
        except (ValueError, TypeError):
            amount = 0.0

        mint = t.get("mint", "UNKNOWN")
        from_user = t.get("fromUserAccount")
        to_user = t.get("toUserAccount")

        row = base.copy()
        row.update({
            "token_address": mint,
            "token_amount": amount,
            "direction": "sent" if from_user == wallet else "received",
            "sender": from_user,
            "receiver": to_user,
            "counterparty": to_user if from_user == wallet else from_user,
        })
        if wallet in [from_user, to_user]:
            counterparties.add(row["counterparty"])
            rows.append(row)
    if not rows:
        for acc in tx.get("accountData", []):
            acct = acc.get("account")
            native_change = acc.get("nativeBalanceChange", 0) / LAMPORT_SCALE
            if acct == wallet:
                row = base.copy()
                row.update({
                    "token_address": NATIVE_SOL,
                    "token_amount": abs(native_change),
                    "direction": "received" if native_change > 0 else "sent",
                    "sender": None,
                    "receiver": wallet,
                    "counterparty": None,
                })
                rows.append(row)

    for event in tx.get("events", {}).get("compressed", []):
        if event.get("type") == "COMPRESSED_NFT_MINT":
            if event.get("newLeafOwner") == wallet:
                row = base.copy()
                row.update({
                    "token_address": "COMPRESSED_NFT",
                    "token_amount": 1,
                    "direction": "received",
                    "sender": event.get("treeDelegate"),
                    "receiver": wallet,
                    "counterparty": event.get("treeDelegate"),
                    "symbol": event.get("metadata", {}).get("name", "NFT"),
                })
                rows.append(row)

    return rows

#Helper function to create row from helius and flipside data

def create_row(tx, wallet, balance_df):
    """
    Takes in a tx from helius data, a wallet address, and balance timeseries data from Flipside.  Returns a df row for analysis 
    """
    tx_summary = summarize_transaction(tx, wallet)
    instructions_data = get_instruction_data(tx, wallet)

    token_tx_df = pd.DataFrame(tx_summary)

    tx_status = "failed" if tx.get("transactionError") else "success"

    token_tx_df['block_number'] = tx.get('slot')
    token_tx_df['tx_fee'] = tx.get('fee') / LAMPORT_SCALE
    token_tx_df['program_id'] = instructions_data.get('programId')
    token_tx_df['tx_status'] = tx_status #if no tx error, can assume it succeeded so we use binary 1 and 0 instead of just leaving nan

    filtered_balance_timeseries = balance_df[['PRE_BALANCE','BALANCE','SYMBOL','NAME','MINT','TX_ID']].rename(columns={'MINT':'token_address'})
    filtered_balance_timeseries = filtered_balance_timeseries.rename(columns={'TX_ID':'signature'})

    if not token_tx_df.empty:
        combined_df = pd.merge(token_tx_df, filtered_balance_timeseries, on=['signature','token_address'], how='left')
    else:
        combined_df = pd.DataFrame()
        
    return combined_df 

def construct_tx_dataset(parsed_transaction_history,address,balance_df):
    tx_level_data = pd.DataFrame()

    for i in parsed_transaction_history:
        row = create_row(i, address, balance_df)
        tx_level_data = pd.concat([tx_level_data, row])

    tx_level_data['timestamp'] = pd.to_datetime(tx_level_data['timestamp'], unit='s')
    tx_level_data.rename(columns={'BALANCE':'POST_BALANCE','NAME':'TOKEN_NAME'},inplace=True)

    prices_data = get_price_data()# Ideally we add date param which is min dt in tx_level_data

    tx_level_data = add_price_data(tx_level_data, prices_data)

    return tx_level_data

def add_price_data(tx_level_data, prices_data):
    tx_level_data['day'] = pd.to_datetime(tx_level_data['timestamp'].dt.strftime('%Y-%m-%d'))
    prices_data = prices_data.rename(columns={'dt': 'day'})
    prices_data['day'] = pd.to_datetime(prices_data['day'])
    tx_level_data = tx_level_data.merge(prices_data[['day', 'token_address', 'price']], on=['day', 'token_address'], how='left')
    tx_level_data['token_amount_usd'] = tx_level_data['token_amount'].fillna(0) * tx_level_data['price']

    #Confirming datatypes 
    float_cols = ['token_amount_usd','token_amount', 'tx_fee','PRE_BALANCE', 'POST_BALANCE']
    int_cols = ['block_number']
    str_cols = ['signature',
        'sender', 'receiver', 'counterparty','SYMBOL', 'TOKEN_NAME', 'token_address']
    category_cols = ['type','source','tx_status','direction']

    tx_level_data[float_cols] = tx_level_data[float_cols].astype(float)
    tx_level_data[int_cols] = tx_level_data[int_cols].astype(float)
    tx_level_data[str_cols] = tx_level_data[str_cols].astype(str)
    tx_level_data[category_cols] = tx_level_data[category_cols].astype("category")

    return tx_level_data

def get_summary_stats(df, address):
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    received_tx = df[df['receiver']==address]
    sent_tx = df[df['sender']==address]

    total_tx = df['signature'].nunique()
    sol_sent_vol = sent_tx[sent_tx['token_address']==NATIVE_SOL]['token_amount'].sum()
    sol_received_vol = received_tx[received_tx['token_address']==NATIVE_SOL]['token_amount'].sum()

    token_received_df = received_tx[received_tx['token_address']!=NATIVE_SOL]
    tokens_recieved_dict = token_received_df.groupby('SYMBOL')[['token_amount']].sum().to_dict()

    token_sent_df = sent_tx[sent_tx['token_address']!=NATIVE_SOL]
    tokens_sent_dict = token_sent_df.groupby('SYMBOL')[['token_amount']].sum().to_dict()

    first_tx = df['timestamp'].min()
    last_tx = df['timestamp'].max()

    df = df.sort_values('timestamp')
    
    avg_tx_interval = df['timestamp'].diff().mean()

    avg_seconds = avg_tx_interval.total_seconds()
    avg_minutes = avg_seconds / 60
    avg_hours = avg_seconds / 3600

    unique_receivers = len(df['receiver'].unique())
    unique_senders = len(df['sender'].unique())

    wallet_analysis_dict = {
        'wallet_address':address,
        'entity_label': df['wallet_entity_label'].iloc[0],
        'num_transactions': total_tx,
        'total_sol_volume_sent': sol_sent_vol,
        'total_sol_volume_received': sol_received_vol,
        'total_token_volume_sent':tokens_sent_dict,
        'total_token_volume_recieved':tokens_recieved_dict,
        'first_tx_time':first_tx,
        'last_tx_time':last_tx,
        'avg_tx_interval (seconds)':avg_seconds,
        'num_unique_senders':unique_senders,
        'num_unique_receivers':unique_receivers
    }

    wallet_analysis_df = pd.DataFrame([wallet_analysis_dict])

    return wallet_analysis_df

def jsonify_safe(obj):
    if isinstance(obj, dict):
        return {k: jsonify_safe(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [jsonify_safe(i) for i in obj]
    elif isinstance(obj, (np.integer, np.int64)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64)):
        return float(obj)
    elif isinstance(obj, (np.ndarray,)):
        return obj.tolist()
    elif isinstance(obj, pd.Timestamp):
        return obj.isoformat()
    else:
        return obj
    
def merge_datasets(tx_level_data_1, wallet_analysis_df):
    # Drop any previous 'sender_entity' and 'receiver_entity' columns if they exist
    tx_level_data=tx_level_data_1.copy()
    tx_level_data = tx_level_data.drop(columns=['sender_entity', 'receiver_entity'], errors='ignore')

    tx_level_data = tx_level_data.merge(
        wallet_analysis_df[['wallet_address', 'entity_label']].rename(columns={
            'wallet_address': 'sender',
            'entity_label': 'sender_entity'
        }),
        how='left',
        on='sender'
    )

    # Clean merge for receiver
    tx_level_data = tx_level_data.merge(
        wallet_analysis_df[['wallet_address', 'entity_label']].rename(columns={
            'wallet_address': 'receiver',
            'entity_label': 'receiver_entity'
        }),
        how='left',
        on='receiver'
    )

    tx_level_data['entity_label'] = tx_level_data['sender_entity'].fillna(tx_level_data['receiver_entity'])

    tx_level_data.drop(columns=['sender_entity', 'receiver_entity'], inplace=True)

    tx_level_data = tx_level_data[[col for col in tx_level_data.columns if not col.endswith('_x') and not col.endswith('_y')]]

    return tx_level_data



