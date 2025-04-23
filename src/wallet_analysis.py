import pandas as pd
import json

# Wallet Analysis Module
class WalletAnalysis:
    def __init__(self, df):
        self.df = df
    
    def track_funding_sources_and_flow(self, wallet_address):
        # Extract token volume totals
        # self.df['token_sent_total'] = self.df['total_token_volume_sent'].apply(self.extract_token_volumes)
        # self.df['token_received_total'] = self.df['total_token_volume_recieved'].apply(self.extract_token_volumes)

        wallet_data = self.df[self.df['wallet_address'] == wallet_address]
        if wallet_data.empty:
            return {"error": "Wallet address not found"}

        # Select and rename relevant fields
        funding_sources = self.df[[
            'wallet_address',
            'entity_label',
            'num_unique_senders',
            'num_unique_receivers',
            'total_sol_volume_sent',
            'total_sol_volume_received',
            'total_token_volume_sent',
            'total_token_volume_recieved'
        ]].copy()

        # Optional: rename columns for clarity
        funding_sources.columns = [
            'Wallet Address',
            'Entity Label',
            'Unique Senders',
            'Unique Receivers',
            'SOL Sent',
            'SOL Received',
            'Token Sent (Total)',
            'Token Received (Total)'
        ]

        return funding_sources


    @staticmethod
    def extract_token_volumes(token_dict):
        if isinstance(token_dict, dict) and 'token_amount' in token_dict:
            return sum(token_dict['token_amount'].values())
        return 0

    # def extract_token_volumes(self, token_dict):
    #     # Extract total token volumes from the dict format {'token_amount': {'token_name': amount, ...}}
    #     token_volumes = sum([amount for token, amount in token_dict['token_amount'].items()])
    #     return token_volumes
    
    def transaction_history(self, wallet_address):
        # Filter data for the specified wallet
        wallet_data = self.df[self.df['wallet_address'] == wallet_address]
        
        if wallet_data.empty:
            return {"error": "Wallet address not found"}

        # Parse token volumes safely
        try:
            token_sent = json.loads(wallet_data['total_token_volume_sent'].iloc[0].replace("'", "\""))
        except (json.JSONDecodeError, TypeError, AttributeError):
            token_sent = {}

        try:
            token_received = json.loads(wallet_data['total_token_volume_recieved'].iloc[0].replace("'", "\""))
        except (json.JSONDecodeError, TypeError, AttributeError):
            token_received = {}

        # Construct transaction history summary
        history = {
            "wallet_address": wallet_address,
            "num_transactions": wallet_data['num_transactions'].iloc[0],
            "total_sol_volume_sent": wallet_data['total_sol_volume_sent'].iloc[0],
            "total_sol_volume_received": wallet_data['total_sol_volume_received'].iloc[0],
            "total_token_volume_sent": token_sent,
            "total_token_volume_received": token_received,
            "first_transaction": wallet_data['first_tx_time'].iloc[0],
            "last_transaction": wallet_data['last_tx_time'].iloc[0],
            "avg_tx_interval_seconds": wallet_data['avg_tx_interval (seconds)'].iloc[0]
        }

        return history

    
    def key_activity_patterns_and_risk_factors(self, wallet_address):
        # Identifying key activity patterns: Average transaction interval, number of unique senders/receivers
        wallet_data = self.df[self.df['wallet_address'] == wallet_address]
        if wallet_data.empty:
            return {"error": "Wallet address not found"}
        
        # Calculate activity metrics
        first_tx = pd.to_datetime(wallet_data['first_tx_time'].iloc[0])
        last_tx = pd.to_datetime(wallet_data['last_tx_time'].iloc[0])
        active_period_days = (last_tx - first_tx).days
        
        patterns = {
            "wallet_address": wallet_address,
            "active_period_days": active_period_days,
            "avg_tx_per_day": wallet_data['num_transactions'].iloc[0] / max(active_period_days, 1),
            "sender_to_receiver_ratio": wallet_data['num_unique_senders'].iloc[0] / max(wallet_data['num_unique_receivers'].iloc[0], 1),
            "sol_net_flow": wallet_data['total_sol_volume_received'].iloc[0] - wallet_data['total_sol_volume_sent'].iloc[0]
        }
        return patterns
    
    def _identify_risk_based_on_activity(self, wallet_address, sol_volume_threshold=100, tx_frequency_threshold=10, unknown_entity=True):
        # A simple threshold logic to flag risky behavior based on high activity
        wallet_data = self.df[self.df['wallet_address'] == wallet_address]
        if wallet_data.empty:
            return {"error": "Wallet address not found"}
        
        # Get activity patterns
        patterns = self.identify_activity_patterns(wallet_address)
        
        # Initialize risk flags
        risks = {
            "wallet_address": wallet_address,
            "high_volume_risk": False,
            "high_frequency_risk": False,
            "unknown_entity_risk": False,
            "risk_summary": []
        }
        
        # Check for high SOL volume
        total_sol_volume = (wallet_data['total_sol_volume_sent'].iloc[0] + 
                           wallet_data['total_sol_volume_received'].iloc[0])
        if total_sol_volume > sol_volume_threshold:
            risks["high_volume_risk"] = True
            risks["risk_summary"].append(f"High SOL volume: {total_sol_volume:.2f} SOL")
        
        # Check for high transaction frequency
        if patterns["avg_tx_per_day"] > tx_frequency_threshold:
            risks["high_frequency_risk"] = True
            risks["risk_summary"].append(f"High tx frequency: {patterns['avg_tx_per_day']:.2f} tx/day")
        
        # Check for unknown entity
        if unknown_entity and wallet_data['entity_label'].iloc[0] == "Unknown Entity":
            risks["unknown_entity_risk"] = True
            risks["risk_summary"].append("Unknown entity label")
        
        return risks
