import pandas as pd
import json
import requests
import time

def get_all_signatures(account_address, helius_api_key, max_pages=20, limit=100):
    url = f"https://mainnet.helius-rpc.com/?api-key={helius_api_key}"
    collected = []
    before = None

    for _ in range(max_pages):
        payload = {
            "jsonrpc": "2.0",
            "id": "1",
            "method": "getSignaturesForAddress",
            "params": [account_address, {"limit": limit, **({"before": before} if before else {})}]
        }

        response = requests.post(
            url,
            headers={"Content-Type": "application/json"},
            data=json.dumps(payload)
        )

        try:
            data = response.json()
            if "error" in data:
                print(f"❌ Error: {data['error']['message']}")
                break

            batch = data["result"]
            if not batch:
                break

            collected.extend(batch)
            before = batch[-1]["signature"]  # Move to next batch

            time.sleep(0.5)  # Avoid rate-limits

        except Exception as e:
            print(f"Exception: {e}")
            break

    return collected

def v0_transactions_all(signatures, helius_api_key):
    import time
    url = f"https://api.helius.xyz/v0/transactions?api-key={helius_api_key}"
    headers = {"Content-Type": "application/json"}

    all_results = []
    batch_size = 100

    for i in range(0, len(signatures), batch_size):
        batch = signatures[i:i+batch_size]
        payload = json.dumps({"transactions": batch})

        response = requests.post(url, headers=headers, data=payload)

        try:
            data = response.json()
            if isinstance(data, dict) and "error" in data:
                print(f"❌ Error at batch {i // batch_size}: {data['error']}")
                continue

            all_results.extend(data)

        except Exception as e:
            print(f"❌ Exception during batch {i // batch_size}: {e}")

        time.sleep(0.3)  # Optional rate limit buffer

    return all_results

def get_balance_data(account_address=None):
    """
    For testing we are using CSV and test address
    """
    balance_df = pd.read_csv('../data/raw/solana_balance_history_test.csv').dropna(how='all')

    # Strip BOMs or invisible characters from column names
    balance_df.columns = balance_df.columns.str.replace('\ufeff', '', regex=False).str.strip()

    # Optionally: remove rows where any column has just a BOM or is empty/whitespace
    balance_df = balance_df[~balance_df.apply(lambda row: row.astype(str).str.contains('\ufeff|^\s*$', regex=True)).any(axis=1)]

    sol_mask = (
        (balance_df['MINT'] == 'So11111111111111111111111111111111111111111') &
        (balance_df['SYMBOL'].isna())
    )

    balance_df.loc[sol_mask, 'SYMBOL'] = 'SOL'
    balance_df.loc[sol_mask, 'NAME'] = 'Solana'

    balance_df['TX_ID'] = balance_df['TX_ID'].str.lower()

    return balance_df
