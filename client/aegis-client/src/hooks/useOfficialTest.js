import { useState, useEffect } from 'react';
import { examAPI } from '../utils/axios';

export const useOfficialTest = () => {
  const [hasOfficialTest, setHasOfficialTest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOfficialTest = async () => {
      try {
        const history = await examAPI.getHistory();
        // Check if there's any official test that hasn't been taken yet
        const hasUnusedOfficialTest = history.some(test => 
          test.type === 'official' && test.status === 'pending'
        );
        setHasOfficialTest(hasUnusedOfficialTest);
      } catch (error) {
        console.error('Failed to check official test status:', error);
        setHasOfficialTest(false);
      } finally {
        setLoading(false);
      }
    };

    checkOfficialTest();
  }, []);

  return { hasOfficialTest, loading };
};
