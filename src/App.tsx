import { useState } from 'react';
import { TransferScreen } from './components/TransferScreen';
import { AnalyzeExample } from './examples/AnalyzeExample';
import { VerifyExample } from './examples/VerifyExample';

type Screen = 'transfer' | 'analyze' | 'verify';

function App() {
  const [screen, setScreen] = useState<Screen>('transfer');

  return (
    <div className="app">
      {/* 네비게이션 (개발/테스트용) */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderBottom: '1px solid #E5E7EB',
        padding: '8px 16px',
        zIndex: 1000,
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setScreen('transfer')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: screen === 'transfer' ? '2px solid #6366F1' : '1px solid #E5E7EB',
              background: screen === 'transfer' ? '#EEF2FF' : 'white',
              color: screen === 'transfer' ? '#6366F1' : '#6B7280',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            실제 송금 화면
          </button>
          <button
            onClick={() => setScreen('analyze')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: screen === 'analyze' ? '2px solid #6366F1' : '1px solid #E5E7EB',
              background: screen === 'analyze' ? '#EEF2FF' : 'white',
              color: screen === 'analyze' ? '#6366F1' : '#6B7280',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            예시: 분석
          </button>
          <button
            onClick={() => setScreen('verify')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: screen === 'verify' ? '2px solid #6366F1' : '1px solid #E5E7EB',
              background: screen === 'verify' ? '#EEF2FF' : 'white',
              color: screen === 'verify' ? '#6366F1' : '#6B7280',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            예시: 검증
          </button>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <div style={{ paddingTop: '56px' }}>
        {screen === 'transfer' && <TransferScreen />}
        {screen === 'analyze' && <AnalyzeExample />}
        {screen === 'verify' && <VerifyExample />}
      </div>
    </div>
  );
}

export default App;
