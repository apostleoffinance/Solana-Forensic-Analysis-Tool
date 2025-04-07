export default function WalletAnalysis({ wallets }) {
    return (
      <div>
        <h2>Wallet Analysis</h2>
        {Object.entries(wallets).map(([wallet, data]) => (
          <div key={wallet} style={{ marginBottom: '20px' }}>
            <h3>{wallet}</h3>
            <p><strong>Funding Sources:</strong> {data.fundingSources.join(', ')}</p>
            <p><strong>Transaction History:</strong> {data.history.join(', ')}</p>
            <p><strong>Activity Patterns:</strong> {data.patterns}</p>
            <p><strong>Entity Connections:</strong> {data.fundingSources.length} known connections</p>
          </div>
        ))}
      </div>
    );
  }