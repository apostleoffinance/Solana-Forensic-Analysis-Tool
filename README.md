---

# 🔍 Solana Forensic Analysis Tool

A full-stack blockchain forensics platform for analyzing Solana on-chain activity — including transaction flow mapping, wallet behavior analysis, clustering of suspicious activity, and entity labeling — designed to detect fraud, trace stolen funds, and surface high-risk actors.

---

## 🚀 Live Demo

🌐 [View the Deployed Tool](https://solana-forensic-analysis-tool-xi.vercel.app/) 

---

## 🧠 Project Overview

This project provides a complete investigative toolkit for analyzing Solana transactions and entities, combining real-time data ingestion, machine learning clustering, and interactive visualization.

**End Deliverables:**
- ✅ Deployed tool with fraud detection & wallet visualization
- ✅ Comprehensive forensic analysis report
- ✅ Finalized GitHub repository with API docs and usage guide
- ✅ Social media-ready findings and case studies

---

## 🗓️ Project Timeline

### Week 1: Research & Setup
- Studied Solana on-chain data structure
- Defined database schema (wallets, transactions, labels)
- Built data ingestion pipelines using Helius, Vybe, and Dune APIs

### Week 2: Transaction Flow Mapping & Wallet Analysis
- Implemented transaction graph using NetworkX
- Developed wallet explorer module with funding traces
- Built filters for wallet address, time range, and amount

### Week 3: Clustering & Entity Labeling
- Clustered suspicious behavior using DBSCAN
- Built entity label dataset from Vybe & Dune
- Created APIs to expose labeled addresses

### Week 4: Deployment & Documentation
- Deployed via FastAPI and Vercel (Next.js)

---

## 🧰 Tech Stack

| Layer        | Stack / Tools |
|--------------|---------------|
| Blockchain Data | Helius, Vybe, Flipside |
| Backend API | Python, FastAPI |
| Frontend | Next.js |
| Visualization | NetworkX, D3.js |
| Deployment | Vercel |

---

## 🔗 Data Sources

| Tool | Purpose |
|------|---------|
| **Helius API** | Raw transaction logs, token transfers |
| **Vybe API** | Entity labeling: exchanges, protocols |
| **Flipside** | Historical blockchain metrics & trends |

---

## ⚙️ Features

### ✅ Transaction Flow Mapping  
Visualize how funds move across wallets.  
- Directed graph (nodes = wallets, edges = flows)
- Supports filters (by token, date range, volume)

### ✅ Wallet Analyzer  
Analyze a wallet’s behavior and connections.  
- Full transaction history
- Funding source tracking
- Activity summary

### ✅ Clustering Engine  
Identify suspicious patterns at scale.  
- Graph-based DBSCAN clustering
- Pattern detection (e.g., layering, wash trading)

### ✅ Entity Labeling  
Know who’s who on-chain.  
- Tags from Vybe and Dune
- Exchange, Mixer, DAO, Scam Wallets, etc.

---

## 🛠️ Getting Started

### 🔧 Requirements
- Python 3.10+
- Node.js 18+
- `.env` with API keys for Helius, Vybe, Dune

### 🐍 Backend Setup

```bash
git clone https://github.com/apostleoffinance/Solana-Forensic-Analysis-Tool.git
cd backend
pip install -r requirements.txt

# Run FastAPI server
uvicorn main:app --reload
```

### 🖼️ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 📊 Forensic Report Highlights

- Traced stolen funds from [Case Study A] through multiple mixers to exchanges.
- Identified wash trading clusters in [Protocol B].
- Labeled 1,200+ unique addresses using Vybe and Dune intel.
- Flagged high-risk wallets with ties to past exploits.


---

## 🧵 Social Media Post

> **🕵️‍♂️ JUST LAUNCHED: Solana Forensic Tool 🔎**  
> Visualize transactions, trace stolen funds, cluster suspicious behavior, and label malicious wallets on Solana — all in one platform!  
> Built with @heliuslabs @vybe_xyz @flipsidecrypto  
> 👉 [Live Demo](https://solana-forensic-analysis-tool-xi.vercel.app/)  
> #Solana #CryptoSecurity #OnchainForensics

---

## 🙌 Acknowledgments

Thanks to:
- **Helius** for real-time Solana RPC data.
- **Vybe** for institutional wallet labeling.
- **Dune** for adversarial intelligence datasets.

---

## 📬 Contribute

PRs and Issues are welcome! If you’d like to collaborate, suggest features, or help extend to Ethereum or Base, feel free to reach out.

---

## 📜 License

MIT License. See `LICENSE.md` for details.

---
