import pandas as pd
import numpy as np
import json
from src.data_fetching import get_all_signatures, v0_transactions_all, get_price_data
from src.metadata import LAMPORT_SCALE, WRAPPED_SOL, NATIVE_SOL
import os

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # This resolves to project root
TEST_TX_PATH = os.path.join(ROOT_DIR, 'data', 'raw', 'test_tx_history.json')

def clean_tx_data(df: pd.DataFrame) -> pd.DataFrame:
    # Drop duplicates
    df = df.drop_duplicates(subset=['signature'])

    # Fill missing wallet names and labels with 'Unknown'
    # Fill name fields with wallet addresses if 'Unknown Address'
    df['sender_name'] = np.where(
        df['sender_name'] == 'Unknown Address',
        df['sender'].str.slice(0, 6),
        df['sender_name']
    )
    df['receiver_name'] = np.where(
        df['receiver_name'] == 'Unknown Address',
        df['receiver'].str.slice(0, 6),
        df['receiver_name']
    )
    df['counterparty_name'] = np.where(
        df['counterparty_name'] == 'Unknown Address',
        df['counterparty'].str.slice(0, 6),
        df['counterparty_name']
    )
    
    # Fill missing wallet_entity_label with 'Unknown'
    df['wallet_entity_label'] = df['wallet_entity_label'].fillna('Unknown Address')
    
    # Convert timestamp to datetime object
    df['timestamp'] = pd.to_datetime(df['timestamp'])

    # 4. Filter for successful SOL transfers
    df = df[
        (df['tx_status'] == 'success') ]
    
    # 5. Remove duplicates based on signature
    df = df.drop_duplicates(subset=['signature'])
    
    # 6. Reset index
    df = df.reset_index(drop=True)


    # Ensure numerical columns are clean
    numeric_cols = ['Native SOL Amount', 'token_amount', 'tx_fee', 'PRE_BALANCE', 'POST_BALANCE']
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    return df

def build_tx_graph(df: pd.DataFrame):
    nodes = {}
    edges = []

    for _, row in df.iterrows():
        sender = row['sender']
        receiver = row['receiver']
        pre_balance = row['PRE_BALANCE'] or 0
        post_balance = row['POST_BALANCE'] or 0
        net_change = post_balance - pre_balance
        native_amount = row['Native SOL Amount'] or 0

        # Add sender node
        if sender not in nodes:
            nodes[sender] = {
                "id": sender,
                "label": row['sender_name'],
                "entity": row['wallet_entity_label'],
                "type": "sender",
                "pre_balance": pre_balance,
                "post_balance": post_balance,
                "net_balance_change": net_change,
                "native_sol_amount": native_amount
            }
        else:
            # Accumulate net change and balances if already added
            nodes[sender]["pre_balance"] = min(nodes[sender]["pre_balance"], pre_balance)
            nodes[sender]["post_balance"] = max(nodes[sender]["post_balance"], post_balance)
            nodes[sender]["net_balance_change"] += net_change
            nodes[sender]["native_sol_amount"] += native_amount
            
        # Add receiver node
        if receiver not in nodes:
            nodes[receiver] = {
                "id": receiver,
                "label": row['receiver_name'],
                "entity": row['wallet_entity_label'],
                "type": "receiver",
                "pre_balance": pre_balance,
                "post_balance": post_balance,
                "net_balance_change": net_change,
                "native_sol_amount": native_amount
            }
        else:
            # Accumulate if already added
            nodes[receiver]["pre_balance"] = min(nodes[receiver]["pre_balance"], pre_balance)
            nodes[receiver]["post_balance"] = max(nodes[receiver]["post_balance"], post_balance)
            nodes[receiver]["net_balance_change"] += net_change
            nodes[receiver]["native_sol_amount"] += native_amount



        # Create edge
        edge = {
            "source": sender,
            "target": receiver,
            "amount": native_amount or row['token_amount'],
            "symbol": row['SYMBOL'],
            "token": row['TOKEN_NAME'],
            "timestamp": row['timestamp'].isoformat(),
            "tx_type": row['type'],
            "program": row['program_name'],
            "signature": row['signature']
        }
        edges.append(edge)

    return {
        "nodes": list(nodes.values()),
        "edges": edges
    }

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




