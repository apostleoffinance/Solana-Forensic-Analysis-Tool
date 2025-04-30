import datetime as dt

def token_prices(token_addresses, start_date, network='solana'):
    """
    Generate a SQL query to fetch median token prices by time frequency.

    Parameters:
    - token_addresses (list): List of token addresses (strings).
    - network (str): The blockchain network (e.g. ethereum, optimism).
    - start_date (str): Start datetime string in 'YYYY-MM-DD HH:MM:SS' format.

    Returns:
    - str: SQL query string.
    """

    start_dt = dt.datetime.strptime(start_date, '%Y-%m-%d %H:%M:%S')
    formatted_start = f"'{start_dt.strftime('%Y-%m-%d %H:%M:%S')}'"

    # Format token list into VALUES clause
    addresses_clause = ", ".join(f"(LOWER('{address}'))" for address in token_addresses)

    query = f"""
    WITH addresses AS (
        SELECT column1 AS token_address 
        FROM (VALUES
            {addresses_clause}
        ) AS tokens(column1)
    )

    SELECT 
        DATE_TRUNC('day', hour) AS dt,
        symbol,
        token_address,
        AVG(price) AS price
    FROM 
        {network}.price.ez_prices_hourly
    WHERE 
        lower(token_address) IN (SELECT token_address FROM addresses)
        AND hour >= DATE_TRUNC('day', TO_TIMESTAMP({formatted_start}, 'YYYY-MM-DD HH24:MI:SS'))
    GROUP BY 
        1, 2, 3
    ORDER BY 
        dt DESC, symbol;
    """

    return query

def wallet_balances(user_address):
    query = f"""
        with balance_data as (

        select * from solana.core.fact_sol_balances where ACCOUNT_ADDRESS in('{user_address}')
        union all 
        select * from solana.core.fact_token_balances WHERE owner in('{user_address}')

        )

        select block_timestamp, owner, mint, pre_balance, balance, tx_id, SUCCEEDED, m.symbol, m.name
        from balance_data b
        left join solana.price.ez_asset_metadata m on b.MINT = m.TOKEN_ADDRESS
        order by block_timestamp desc



        """
    
    return query