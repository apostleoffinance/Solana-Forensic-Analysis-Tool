'use client';

import { createContext, useState, useContext, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [address, setAddress] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pathname = usePathname();

  // Cached addresses
  const CACHED_ADDRESSES = [
    'AGPZnBZUxmhAtcp8XjT4n8bCia9dEYhhm16M2sfFvmTU',
    'CoaKnxNQCJ91FyyNqxmwxEHwzdw8YHmgF3ZpLNjf1TzG',
    '8psNvWTrdNTiVRNzAgsou9kETXNJm2SXZyaKuJraVRtf',
  ];

  const isHomepage = pathname === '/';
  const shouldShowModal = !isHomepage && !data && !error;

  async function analyzeAddress(address) {
    try {
      // Check if address is cached
      if (CACHED_ADDRESSES.includes(address)) {
        console.log(`Address ${address} is cached, retrieving results...`);
        const POLL_INTERVAL = 5000; // 5 seconds
        const MAX_ATTEMPTS = 12; // 1 minute max
        let attempts = 0;

        while (attempts < MAX_ATTEMPTS) {
          const response = await fetch(`/api/get-results?job_id=${address}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`Get results error! status: ${response.status}`);
          }

          const result = await response.json();
          console.log(`get_results response for ${address}:`, result); // Debug log

          // Handle completed status
          if (result.status === 'completed') {
            return result.data; // Expect { tx_graph, wallet_analysis }
          }
          // Handle direct data response (no status field)
          else if (result.tx_graph && result.wallet_analysis) {
            console.log(`Direct data received for ${address}`);
            return result; // Return { tx_graph, wallet_analysis } directly
          }
          // Handle processing or pending
          else if (result.status === 'processing' || result.status === 'pending') {
            console.log(`Still processing cached address ${address}, attempt ${attempts + 1}...`);
            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
            attempts++;
          }
          // Handle unexpected response
          else {
            throw new Error(`Unexpected response for cached address: ${JSON.stringify(result)}`);
          }
        }
        throw new Error('Timed out waiting for cached address results');
      }

      // Call analyze-address API route for non-cached addresses
      const response = await fetch('/api/analyze-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result; // Expecting { tx_graph, wallet_analysis } from the API route
    } catch (err) {
      console.error('Error analyzing address:', err);
      throw err;
    }
  }

  const handleAddressSubmit = async (submittedAddress) => {
    try {
      if (!submittedAddress || submittedAddress.length !== 44) {
        throw new Error('Invalid Solana address. Please enter a valid address.');
      }
      setAddress(submittedAddress);
      setData(null); // Reset data before fetching new
      setError(null); // Clear previous errors
      const result = await analyzeAddress(submittedAddress);
      setData(result); // Set data as { tx_graph, wallet_analysis }
      setIsModalOpen(false); // Close modal on success
    } catch (err) {
      setError(err.message);
      // Modal stays open on error
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Open modal on non-homepage routes if no data
  useEffect(() => {
    if (shouldShowModal) {
      setIsModalOpen(true);
    } else {
      setIsModalOpen(false);
    }
  }, [shouldShowModal]);

  return (
    <DataContext.Provider
      value={{
        data,
        error,
        address,
        isModalOpen,
        setIsModalOpen,
        handleAddressSubmit,
        isHomepage,
        clearError,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}