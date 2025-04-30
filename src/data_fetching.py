import pandas as pd
import json
import requests
import time
import os
from src.metadata import LAMPORT_SCALE, WRAPPED_SOL, NATIVE_SOL
from src.sql import wallet_balances, token_prices


from dotenv import load_dotenv
load_dotenv()

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # This resolves to project root
TEST_BAL_PATH = os.path.join(ROOT_DIR, 'data', 'raw', 'solana_balance_history_test.csv')
TEST_PRICES_PATH = os.path.join(ROOT_DIR, 'data', 'raw', 'test_address_prices.csv')
CACHE_DIR = os.path.join(ROOT_DIR, "data", "raw")
FLIPSIDE_API_KEY = os.getenv('FLIPSIDE_API_KEY')

VYBE_API_KEY = os.getenv('VYBE_API_KEY')

def get_all_signatures(account_address, helius_api_key, max_pages=20, limit=100, max_retries=5, sleep_seconds=5):
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

        success = False
        for attempt in range(max_retries):
            try:
                response = requests.post(
                    url,
                    headers={"Content-Type": "application/json"},
                    data=json.dumps(payload),
                    timeout=10
                )

                data = response.json()
                if "error" in data:
                    print(f"❌ Error: {data['error']['message']}")
                    if attempt < max_retries - 1:
                        print(f"Retrying... (attempt {attempt+1}/{max_retries})")
                        time.sleep(sleep_seconds)
                        continue
                    else:
                        return collected  # Exit if max retries hit

                batch = data.get("result", [])
                if not batch:
                    return collected  # No more results

                collected.extend(batch)
                before = batch[-1]["signature"]
                success = True
                break

            except Exception as e:
                print(f"Exception: {e}")
                if attempt < max_retries - 1:
                    print(f"Retrying after error... (attempt {attempt+1}/{max_retries})")
                    time.sleep(sleep_seconds)
                else:
                    return collected  # Exit if max retries hit

        if not success:
            break  # Stop paging if failed to fetch this page

        time.sleep(0.5)  # Rate-limit protection between *successful* pages

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

def get_balance_data(account_address=None, use_cache=False):
    """
    For testing we are using CSV and test address
    """

    if not use_cache:

        balance_data_query = wallet_balances(account_address)

        try:

            balance_df = flipside_api_results(balance_data_query)
            balance_df.columns = balance_df.columns.str.upper()
            print(f'balance_df: {balance_df}')

            balance_df.to_csv(TEST_BAL_PATH, index=False)
        except Exception as e:
            print(f'e: {e}')
            balance_df = pd.read_csv(TEST_BAL_PATH).dropna(how='all')
    else:
        balance_df = pd.read_csv(TEST_BAL_PATH).dropna(how='all')
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

    return balance_df

def get_price_data(token_addresses, start_date, use_cache=False):
    # For now we pull from 
    if not use_cache:
        try:
            prices_query = token_prices(token_addresses,start_date)
            prices_data = flipside_api_results(prices_query)
            print(f'prices_data: {prices_data}')
            prices_data.to_csv(TEST_PRICES_PATH, index=False)
        except Exception as e:
            print(f'e: {e}')
            prices_data = pd.read_csv(TEST_PRICES_PATH).dropna()
    else:
        prices_data = pd.read_csv(TEST_PRICES_PATH).dropna()

    prices_data['dt'] = pd.to_datetime(pd.to_datetime(prices_data['dt']).dt.strftime('%Y-%m-%d'))
    prices_data.columns = prices_data.columns.str.lower()

    # Duplicate wrapped SOL rows with native SOL address
    wrapped_sol_prices = prices_data[prices_data['token_address'] == WRAPPED_SOL].copy()
    wrapped_sol_prices['token_address'] = NATIVE_SOL

    # Append to original price data
    prices_data = pd.concat([prices_data, wrapped_sol_prices], ignore_index=True)

    return prices_data

def get_vybe_identified_accounts(use_cache=True):
    cache_file = os.path.join(CACHE_DIR, "vybe_identified_accounts.json")

    if use_cache and os.path.exists(cache_file):
        with open(cache_file, 'r') as f:
            return json.load(f)

    url = "https://api.vybenetwork.xyz/account/known-accounts"
    headers = {"accept": "application/json", "X-API-KEY": VYBE_API_KEY}
    response = requests.get(url, headers=headers)
    data = response.json()

    identified_addresses = {}
    for account in data.get('accounts', []):
        address = account.get('ownerAddress', '').lower()
        name = account.get('name', '')
        identified_addresses[address] = name

    # Save to cache
    with open(cache_file, 'w') as f:
        json.dump(identified_addresses, f)

    return identified_addresses

def get_vybe_identified_programs(use_cache=True):
    cache_file = os.path.join(CACHE_DIR, "vybe_identified_programs.json")

    if use_cache and os.path.exists(cache_file):
        with open(cache_file, 'r') as f:
            return json.load(f)

    url = "https://api.vybenetwork.xyz/program/known-program-accounts"
    headers = {"accept": "application/json", "X-API-KEY": VYBE_API_KEY}
    response = requests.get(url, headers=headers)
    data = response.json()

    identified_programs = {}
    for account in data.get('programs', []):
        program_id = account.get('programId', '').lower()
        name = account.get('name', '')
        identified_programs[program_id] = name

    # Save to cache
    with open(cache_file, 'w') as f:
        json.dump(identified_programs, f)

    return identified_programs

def chunked(iterable, size):
    """Yield successive `size`-sized chunks from iterable."""
    for i in range(0, len(iterable), size):
        yield iterable[i:i + size]

def fetch_address_labels(unique_addresses, chain_id, api_key, delay=0.2):
    url = "https://aml.blocksec.com/address-label/api/v3/batch-labels"
    headers = {
        "API-KEY": api_key,
        "Content-Type": "application/json"
    }
    results = []

    for chunk in chunked(unique_addresses, 100):
        response = requests.post(
            url,
            headers=headers,
            json={
                "chain_id": chain_id,
                "addresses": chunk
            }
        )
        data = response.json()
        print(f'data: {data}')
        if data.get("code") == 200000:
            results.extend(data.get("data", []))
        else:
            print(f"[Error] Batch failed: {data}")
        time.sleep(delay)  # optional delay to avoid rate limits

    return results

def flipside_api_results(query=None, query_run_id=None, attempts=10, delay=30):

    url = "https://api-v2.flipsidecrypto.xyz/json-rpc"
    headers = {"Content-Type": "application/json", "x-api-key": FLIPSIDE_API_KEY}

    if query_run_id is None:
        payload = {
            "jsonrpc": "2.0",
            "method": "createQueryRun",
            "params": [{"resultTTLHours": 1, "maxAgeMinutes": 0, "sql": query,
                        "tags": {"source": "python-script", "env": "production"},
                        "dataSource": "snowflake-default", "dataProvider": "flipside"}],
            "id": 1
        }
        response = requests.post(url, headers=headers, json=payload)
        response_data = response.json()
        if 'error' in response_data:
            raise Exception(f"Error creating query: {response_data['error']['message']}")
        query_run_id = response_data.get('result', {}).get('queryRun', {}).get('id')
        if not query_run_id:
            raise KeyError(f"Query creation failed. Response: {response_data}")

    for attempt in range(attempts):
        status_payload = {
            "jsonrpc": "2.0",
            "method": "getQueryRunResults",
            "params": [{"queryRunId": query_run_id, "format": "json", "page": {"number": 1, "size": 10000}}],
            "id": 1
        }
        response = requests.post(url, headers=headers, json=status_payload)
        resp_json = response.json()

        if 'result' in resp_json and 'rows' in resp_json['result']:
            all_rows, page_number = [], 1
            while True:
                status_payload["params"][0]["page"]["number"] = page_number
                response = requests.post(url, headers=headers, json=status_payload)
                resp_json = response.json()
                rows = resp_json.get('result', {}).get('rows', [])
                if not rows:
                    break
                all_rows.extend(rows)
                page_number += 1
            return pd.DataFrame(all_rows)

        if 'error' in resp_json and 'not yet completed' in resp_json['error'].get('message', '').lower():
            time.sleep(delay)
        else:
            raise Exception(f"Error fetching query results: {resp_json}")

    raise TimeoutError(f"Query did not complete after {attempts} attempts.")
    
