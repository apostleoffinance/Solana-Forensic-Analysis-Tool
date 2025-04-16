import pandas as pd
import numpy as np
import json
from src.data_fetching import get_all_signatures, v0_transactions_all

LAMPORT_SCALE = 1e9

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
        with open('../data/raw/test_tx_history.json') as f:
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

        with open('../data/raw/test_tx_history.json', 'w') as f:
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
    native_amount = 0
    token_address = None
    token_amount = 0
    counterparties = set()
    sender = None
    receiver = None
    direction = None

    # Native transfers (track total SOL involved)
    for t in tx.get("nativeTransfers", []):
        amount = t.get("amount", 0) / LAMPORT_SCALE
        from_user = t.get("fromUserAccount")
        to_user = t.get("toUserAccount")

        if from_user == wallet:
            native_amount -= amount
            counterparties.add(to_user)
            sender = wallet
            receiver = to_user
            direction = "sent"
        elif to_user == wallet:
            native_amount += amount
            counterparties.add(from_user)
            sender = from_user
            receiver = wallet
            direction = "received"

    # Token transfers (assume one token per tx or summarize total of one type)
    for t in tx.get("tokenTransfers", []):
        try:
            amount = float(t.get("tokenAmount", 0))
        except (ValueError, TypeError):
            amount = 0

        mint = t.get("mint", "UNKNOWN")
        from_user = t.get("fromUserAccount")
        to_user = t.get("toUserAccount")

        if from_user == wallet:
            token_address = mint
            token_amount -= amount
            counterparties.add(to_user)
            sender = wallet
            receiver = to_user
            direction = "sent"
        elif to_user == wallet:
            token_address = mint
            token_amount += amount
            counterparties.add(from_user)
            sender = from_user
            receiver = wallet
            direction = "received"

    return {
        "timestamp": tx.get("timestamp"),
        "signature": tx.get("signature"),
        "type": tx.get("type", "UNKNOWN"),
        "source": tx.get("source", "UNKNOWN"),
        "tx_status": int(tx.get("transactionError") is None),
        "direction": direction,
        "sender": sender,
        "receiver": receiver,
        "counterparty": list(counterparties)[0] if len(counterparties) == 1 else None,
        "Native SOL Amount": abs(native_amount) if native_amount else None,
        "token_address": token_address,
        "token_amount": abs(token_amount) if token_address else None
    }

def create_row(tx, wallet, balance_df):
    """
    Takes in a tx from helius data, a wallet address, and balance timeseries data from Flipside.  Returns a df row for analysis 
    """
    tx_summary = summarize_transaction(tx, wallet)
    instructions_data = get_instruction_data(tx, wallet)

    token_tx_df = pd.DataFrame([tx_summary])
    tx_status = "failed" if tx.get("transactionError") else "success"

    token_tx_df['block_number'] = tx.get('slot')
    token_tx_df['tx_fee'] = tx.get('fee') / LAMPORT_SCALE
    token_tx_df['program_id'] = instructions_data.get('programId')
    token_tx_df['tx_status'] = tx_status #if no tx error, can assume it succeeded so we use binary 1 and 0 instead of just leaving nan
    token_tx_df['signature'] = token_tx_df['signature'].str.lower()

    filtered_balance_timeseries = balance_df[['PRE_BALANCE','BALANCE','SYMBOL','NAME','MINT','TX_ID']]
    filtered_balance_timeseries = filtered_balance_timeseries.rename(columns={'TX_ID':'signature'})

    combined_df = pd.merge(token_tx_df,filtered_balance_timeseries,on='signature', how='left')
    return combined_df 

def construct_tx_dataset(parsed_transaction_history,address,balance_df):
    tx_level_data = pd.DataFrame()

    for i in parsed_transaction_history:
        row = create_row(i, address, balance_df)
        tx_level_data = pd.concat([tx_level_data, row]).drop_duplicates(subset='signature')

    tx_level_data['timestamp'] = pd.to_datetime(tx_level_data['timestamp'], unit='s')
    tx_level_data.rename(columns={'BALANCE':'POST_BALANCE','NAME':'TOKEN_NAME'},inplace=True)

    #Confirming datatypes 
    float_cols = ['Native SOL Amount','token_amount', 'tx_fee','PRE_BALANCE', 'POST_BALANCE']
    int_cols = ['block_number']
    str_cols = ['signature',
        'sender', 'receiver', 'counterparty','SYMBOL', 'TOKEN_NAME', 'MINT']
    category_cols = ['type','source','tx_status','direction']

    tx_level_data[float_cols] = tx_level_data[float_cols].astype(float)
    tx_level_data[int_cols] = tx_level_data[int_cols].astype(float)
    tx_level_data[str_cols] = tx_level_data[str_cols].astype(str)
    tx_level_data[category_cols] = tx_level_data[category_cols].astype("category")

    return tx_level_data