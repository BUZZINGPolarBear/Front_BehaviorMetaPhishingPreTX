import { useState } from 'react';
import { BankingHome } from './components/BankingHome';
import { TransferScreen } from './components/TransferScreen';

type Screen = 'home' | 'transfer';

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [stressLevel, setStressLevel] = useState(0);

  return (
    <div className="app">
      {screen === 'home' && (
        <BankingHome
          onNavigateToTransfer={() => setScreen('transfer')}
          stressLevel={stressLevel}
        />
      )}
      {screen === 'transfer' && (
        <TransferScreen
          onBack={() => {
            setScreen('home');
            setStressLevel(0);
          }}
        />
      )}
    </div>
  );
}

export default App;
