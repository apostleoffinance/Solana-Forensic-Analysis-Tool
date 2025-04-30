'use client';

import { useState } from 'react';
import { useData } from '@/app/DataContext';

export default function AddressModal() {
  const { isModalOpen, handleAddressSubmit, error, isHomepage, setIsModalOpen, clearError } = useData();
  const [inputAddress, setInputAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent submission if already loading
    setLoading(true);
    try {
      await handleAddressSubmit(inputAddress);
      setInputAddress(''); // Clear input after successful submission
    } finally {
      setLoading(false); // Reset loading state after success or failure
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  // Clear error when user starts typing
  const handleInputChange = (e) => {
    setInputAddress(e.target.value);
    if (error) clearError(); // Clear error when user types
  };

  // Don't render anything on homepage
  if (isHomepage) return null;

  return (
    <div>
      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-content">
            <h2 id="modal-title">{inputAddress ? 'Update Solana Address' : 'Enter Solana Address'}</h2>
            <p>
              {inputAddress
                ? 'Enter a new Solana address to update the data.'
                : 'Please provide a valid Solana address to view the data.'}
            </p>
            <form onSubmit={onSubmit}>
              <input
                type="text"
                value={inputAddress}
                onChange={handleInputChange}
                placeholder="Enter Solana address (44 characters)"
                className="address-input"
                disabled={loading} // Disable input during loading
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'error-message' : undefined}
              />
              {error && (
                <p id="error-message" className="error-message">
                  {error}
                </p>
              )}
              <div className="button-group">
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                  aria-label={loading ? 'Submitting address' : inputAddress ? 'Update address' : 'Submit address'}
                >
                  {loading ? 'Loading, please wait...' : inputAddress ? 'Update' : 'Submit'}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setIsModalOpen(false);
                    clearError(); // Clear error on cancel
                  }}
                  disabled={loading}
                  aria-label="Cancel"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Address Button */}
      {!isModalOpen && (
        <button
          className="change-address-btn"
          onClick={openModal}
          aria-label="Change Solana address"
        >
          Change Address
        </button>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          background-color: var(--card-bg);
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid var(--border);
          max-width: 400px;
          width: 90%;
          text-align: center;
          color: var(--text-primary);
        }
        h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
        p {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }
        .address-input {
          width: 100%;
          padding: 0.5rem;
          margin-bottom: 1rem;
          border: 1px solid var(--border);
          border-radius: 4px;
          background-color: var(--input-bg, rgba(255, 255, 255, 0.05));
          color: var(--text-primary);
          font-size: 0.9rem;
        }
        .address-input:focus {
          outline: none;
          border-color: var(--accent-blue);
        }
        .address-input:disabled {
          background-color: var(--text-secondary);
          cursor: not-allowed;
          opacity: 0.6;
        }
        .address-input[aria-invalid='true'] {
          border-color: var(--accent-red);
        }
        .error-message {
          color: var(--accent-red);
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }
        .button-group {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }
        .submit-btn, .cancel-btn {
          background-color: var(--accent-blue);
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .cancel-btn {
          background-color: var(--text-secondary);
        }
        .submit-btn:hover:not(:disabled), .cancel-btn:hover:not(:disabled) {
          background-color: #2563eb;
        }
        .cancel-btn:hover:not(:disabled) {
          background-color: #718096;
        }
        .submit-btn:disabled, .cancel-btn:disabled {
          background-color: var(--text-secondary);
          cursor: not-allowed;
          opacity: 0.6;
        }
        .change-address-btn {
          position: fixed;
          bottom: 1rem;
          right: 1rem;
          background-color: var(--accent-blue);
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 0.85rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
          z-index: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .change-address-btn:hover {
          background-color: #2563eb;
        }
        @media (max-width: 768px) {
          .change-address-btn {
            padding: 0.4rem 0.8rem;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
}