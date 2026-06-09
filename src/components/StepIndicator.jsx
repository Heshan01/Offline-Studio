import React from 'react';

export default function StepIndicator({ status }) {
  const getStepClass = (step) => {
    if (step === 1) return status !== 'idle' ? 'completed' : 'active';
    if (step === 2) return status === 'compressing' || status === 'completed' ? 'completed' : status === 'ready' ? 'active' : '';
    if (step === 3) return status === 'completed' ? 'completed' : status === 'compressing' ? 'active' : '';
    if (step === 4) return status === 'completed' ? 'active' : '';
    return '';
  };

  return (
    <div className="steps-indicator">
      <div className={`step-node ${getStepClass(1)}`}>1</div>
      <div className={`step-node ${getStepClass(2)}`}>2</div>
      <div className={`step-node ${getStepClass(3)}`}>3</div>
      <div className={`step-node ${getStepClass(4)}`}>4</div>
    </div>
  );
}
