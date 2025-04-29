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

  const isHomepage = pathname === '/';
  const shouldShowModal = !isHomepage && !data && !error;

  async function analyzeAddress(address) {
    const url = '/api/analyze-address';
    try {
      const response = await fetch(url, {
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
      return result;
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
      setData(result);
      setIsModalOpen(false); // Close modal only on success
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