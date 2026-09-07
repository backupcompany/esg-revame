import { useEffect, useState } from 'react';
import { CategoryMasterDefinition, loadMasterCategories, MASTER_CATEGORIES } from '../utils/catalogDictionary';

export function useMasterCategories(): CategoryMasterDefinition[] {
  const [cats, setCats] = useState(MASTER_CATEGORIES);
  useEffect(() => {
    loadMasterCategories().then(setCats);
  }, []);
  return cats;
}
