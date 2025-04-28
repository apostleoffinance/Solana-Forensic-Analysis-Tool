'use client'; // if you're using Next.js App Router

import { createContext, useState, useEffect, useContext } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await analyzeAddress('H39xmfk1fLu9gH7Peiq6zqibxLJCWC6XXmzoRRNguW5i');
        setData(result);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchData();
  }, []);

  return (
    <DataContext.Provider value={{ data, error }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
