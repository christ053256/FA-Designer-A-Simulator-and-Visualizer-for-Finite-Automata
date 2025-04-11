import { useState, useEffect } from 'react';
import './App.css';

// Component for the state circle with added description
const StateCircle = ({ id, label, isActive, isAccept, isReject, description }) => {
  let stateClass = 'state-circle state-circle-default';
  
  if (isAccept) stateClass = 'state-circle state-circle-accept';
  if (isReject) stateClass = 'state-circle state-circle-reject';
  
  const activeClass = isActive ? 'state-circle-active' : 'state-circle-inactive';
  
  // Double circle for accept states
  const acceptRing = isAccept ? (
    <div className="accept-ring"></div>
  ) : null;
  
  return (
    <div className="state-node">
      <div className={`${stateClass} ${activeClass}`}>
        {acceptRing}
        <div className="text-center">
          <div className="state-id">{id}</div>
          <div className="state-description">{label}</div>
        </div>
      </div>
      {description && (
        <div className="state-input-description">
          {description}
        </div>
      )}
    </div>
  );
};

// Component for state transitions with visual arrows
const StateTransitionArrow = ({ from, to, label, isActive, position }) => {
  const arrowClass = isActive ? 'transition-arrow-active' : 'transition-arrow-inactive';
  
  // Different arrow styles based on position
  const arrowStyles = {
    top: { className: 'arrow-top', symbol: '↑' },
    right: { className: 'arrow-right', symbol: '→' },
    bottom: { className: 'arrow-bottom', symbol: '↓' },
    left: { className: 'arrow-left', symbol: '←' },
    'self-loop': { className: 'arrow-self-loop', symbol: '↻' }
  };
  
  const arrowStyle = arrowStyles[position] || arrowStyles.right;
  
  return (
    <div className={`state-transition-arrow ${arrowStyle.className} ${arrowClass}`}>
      <div className="arrow-label">{label}</div>
      <div className="arrow-symbol">{arrowStyle.symbol}</div>
    </div>
  );
};

// Component for transition arrows
const TransitionArrow = ({ label, isActive }) => {
  const activeClass = isActive ? 'transition-arrow-active' : 'transition-arrow-inactive';
  const lineClass = isActive ? 'transition-arrow-line-active' : 'transition-arrow-line-inactive';
  const headClass = isActive ? 'transition-arrow-head-active' : 'transition-arrow-head-inactive';
  
  return (
    <div className={`transition-arrow ${activeClass}`}>
      <div className="transition-arrow-label">{label}</div>
      <div className={`transition-arrow-line ${lineClass}`}></div>
      <div className={`transition-arrow-head ${headClass}`}>▶</div>
    </div>
  );
};

// Component for character display
const CharacterDisplay = ({ char, status }) => {
  let characterClass = 'character-display';
  
  if (status === 'valid') {
    characterClass += ' character-valid';
  } else if (status === 'invalid') {
    characterClass += ' character-invalid';
  } else if (status === 'current') {
    characterClass += ' character-current';
  } else {
    characterClass += ' character-pending';
  }
  
  return (
    <div className={characterClass}>
      {char}
    </div>
  );
};

export default function EnhancedVariableNameValidator() {
  const [input, setInput] = useState('');
  const [description, setDescription] = useState('');
  const [isValid, setIsValid] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentState, setCurrentState] = useState('q0');
  const [speed, setSpeed] = useState(500);
  const [isSimulating, setIsSimulating] = useState(false);
  const [animationIndex, setAnimationIndex] = useState(0);
  const [activeTransition, setActiveTransition] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [examplePresets, setExamplePresets] = useState([
    { name: 'myVariable', description: 'A variable to store user data', valid: true },
    { name: '_counter', description: 'A counter for iterations', valid: true },
    { name: 'x123', description: 'X-coordinate position', valid: true },
    { name: '123abc', description: 'ID number with prefix', valid: false },
    { name: 'my-var', description: 'My special variable', valid: false },
    { name: '$price', description: 'Price of an item', valid: false }
  ]);
  const [darkMode, setDarkMode] = useState(false);

  // Reset the simulation when input changes
  useEffect(() => {
    resetSimulation();
  }, [input]);

  // Animation effect
  useEffect(() => {
    if (!isSimulating) return;
    
    if (animationIndex >= input.length) {
      setIsSimulating(false);
      setActiveTransition(null);
      
      // Once simulation is complete and the name is valid, analyze for recommendation
      if (isValid) {
        analyzeVariableName();
      }
      return;
    }

    const timer = setTimeout(() => {
      processNextChar(animationIndex);
      setAnimationIndex(animationIndex + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [isSimulating, animationIndex, speed, input]);

  const resetSimulation = () => {
    setCurrentState('q0');
    setSteps([]);
    setIsValid(null);
    setAnimationIndex(0);
    setIsSimulating(false);
    setActiveTransition(null);
    setRecommendation(null);
  };

  const validateVariable = () => {
    resetSimulation();
    if (input.length > 0) {
      setIsSimulating(true);
    }
  };

  const processNextChar = (index) => {
    const char = input[index];
    let prevState = currentState;
    let nextState = determineNextState(prevState, char);
    
    let transitionType;
    if (prevState === 'q0' && (isLetter(char) || char === '_')) {
      transitionType = 'letter_underscore';
    } else if (prevState === 'q1' && (isLetter(char) || isDigit(char) || char === '_')) {
      transitionType = 'letter_digit_underscore';
    } else {
      transitionType = 'other';
    }
    
    setActiveTransition(transitionType);
    
    setSteps(prev => [...prev, {
      char,
      prevState,
      nextState,
      transitionType
    }]);
    
    setCurrentState(nextState);
    setIsValid(nextState === 'q1');
  };

  const determineNextState = (state, char) => {
    if (state === 'qR') return 'qR';
    
    if (state === 'q0') {
      // First character must be letter or underscore
      if (isLetter(char) || char === '_') return 'q1';
      return 'qR';
    }
    
    if (state === 'q1') {
      // Subsequent characters must be letter, digit, or underscore
      if (isLetter(char) || isDigit(char) || char === '_') return 'q1';
      return 'qR';
    }
    
    return 'qR';
  };

  const isLetter = (char) => /[a-zA-Z]/.test(char);
  const isDigit = (char) => /[0-9]/.test(char);

  const getCharacterStatus = (index) => {
    if (isSimulating && index === animationIndex) return 'current';
    if (index < steps.length) {
      const step = steps[index];
      return step.nextState === 'qR' ? 'invalid' : 'valid';
    }
    return 'pending';
  };
  
  const usePreset = (preset) => {
    setInput(preset.name);
    setDescription(preset.description);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Function to analyze variable name based on description
  const analyzeVariableName = () => {
    if (!input || !description) {
      setRecommendation(null);
      return;
    }
    
    let score = 0;
    let recommendations = [];
    let positives = [];
    
    // Check for naming convention - camelCase is preferred for variables
    const isCamelCase = /^[a-z][a-zA-Z0-9_]*$/.test(input) && /[A-Z]/.test(input) && !input.startsWith('_');
    const isPascalCase = /^[A-Z][a-zA-Z0-9_]*$/.test(input);
    const isSnakeCase = /^[a-z][a-z0-9_]*$/.test(input) && input.includes('_');
    const isAllCaps = /^[A-Z][A-Z0-9_]*$/.test(input);
    
    if (isCamelCase) {
      score += 2;
      positives.push("Uses camelCase notation, which is ideal for variables");
    } else if (isPascalCase) {
      recommendations.push("Consider using camelCase instead of PascalCase for variables (PascalCase is typically used for classes)");
    } else if (isSnakeCase) {
      score += 1;
      positives.push("Uses snake_case, which is readable but consider camelCase for better convention");
    } else if (isAllCaps) {
      recommendations.push("ALL_CAPS naming is typically reserved for constants, not variables");
    }
    
    // Check for Hungarian notation (not recommended in modern code)
    if (/^[a-z][a-z][A-Z]/.test(input)) {
      recommendations.push("Avoid Hungarian notation (type prefixes like 'strName') as it's considered outdated");
    }
    
    // Check length - neither too short nor too long
    if (input.length < 3 && !['i', 'j', 'k', 'x', 'y', 'z'].includes(input)) {
      recommendations.push("Variable name is very short. Consider a more descriptive name unless it's a well-known convention (like 'i' for loops)");
    } else if (input.length > 25) {
      recommendations.push("Variable name is very long. Consider a more concise name");
    } else if (input.length >= 3 && input.length <= 15) {
      score += 1;
      positives.push("Name length is appropriate");
    }
    
    // Check if description keywords are reflected in the name
    const keywords = description.toLowerCase().split(/\s+/).filter(word => 
      word.length > 3 && !['this', 'that', 'with', 'from', 'into', 'onto', 'for', 'and', 'the'].includes(word)
    );
    
    const inputLower = input.toLowerCase();
    const foundKeywords = keywords.filter(word => inputLower.includes(word.toLowerCase()));
    
    if (foundKeywords.length > 0) {
      score += 2;
      positives.push(`Name reflects its purpose (contains keywords: ${foundKeywords.join(', ')})`);
    } else {
      const variableType = identifyVariableTypeFromDescription(description);
      if (variableType && !inputLower.includes(variableType.toLowerCase())) {
        recommendations.push(`Consider including "${variableType}" in the name to reflect its purpose`);
      }
    }
    
    // Check for leading underscore
    if (input.startsWith('_')) {
      recommendations.push("Leading underscore is often used for private properties/variables, be sure this is intentional");
    }
    
    // Check for common prefixes/suffixes that don't add meaning
    if (/^(tmp|temp|var|my)[A-Z]/.test(input)) {
      recommendations.push("Avoid uninformative prefixes like 'tmp', 'temp', 'var', or 'my'");
    }
    
    // Calculate overall recommendation
    let overallRecommendation;
    if (score >= 4) {
      overallRecommendation = "Great variable name! It follows best practices.";
    } else if (score >= 2) {
      overallRecommendation = "Good variable name with room for improvement.";
    } else {
      overallRecommendation = "This variable name could be improved.";
    }
    
    setRecommendation({
      overall: overallRecommendation,
      score,
      positives,
      recommendations
    });
  };
  
  const identifyVariableTypeFromDescription = (desc) => {
    const descLower = desc.toLowerCase();
    
    if (descLower.includes('count') || descLower.includes('number of') || descLower.includes('counter')) 
      return 'Count';
    if (descLower.includes('index') || descLower.includes('position'))
      return 'Index';
    if (descLower.includes('flag') || descLower.includes('boolean') || descLower.includes('condition'))
      return 'Is' || 'Has';
    if (descLower.includes('price') || descLower.includes('cost') || descLower.includes('amount'))
      return 'Amount';
    if (descLower.includes('name') || descLower.includes('label') || descLower.includes('title'))
      return 'Name';
    if (descLower.includes('date') || descLower.includes('time'))
      return 'Date';
    if (descLower.includes('list') || descLower.includes('array') || descLower.includes('collection'))
      return 'List';
    
    return null;
  };

  const themeMode = darkMode ? '-dark' : '-light';

  return (
    <div className={`app-container app-container${themeMode}`}>
      <div className="content-container">
        <div className="header-container">
          <h1 className={`app-title app-title${themeMode}`}>
            Variable Name Validator
          </h1>
          <button 
            onClick={toggleDarkMode}
            className={`theme-toggle-btn theme-toggle-btn${themeMode}`}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <div className={`card card${themeMode}`}>
          <div className="card-header">
            <h2 className={`card-title card-title${themeMode}`}>
              Test a Variable Name
            </h2>
            <button 
              onClick={() => setShowExplanation(!showExplanation)}
              className={`toggle-btn toggle-btn${themeMode}`}
            >
              {showExplanation ? 'Hide Rules' : 'Show Rules'}
            </button>
          </div>

          {showExplanation && (
            <div className={`rules-panel rules-panel${themeMode}`}>
              <h3 className="rules-title">Valid Variable Name Rules:</h3>
              <ul className="rules-list">
                <li className="rules-list-item">Must start with a letter (a-z, A-Z) or underscore (_)</li>
                <li className="rules-list-item">Can contain letters, digits (0-9), and underscores</li>
                <li className="rules-list-item">No spaces or special characters allowed</li>
                <li className="rules-list-item">No reserved keywords (not checked in this simulator)</li>
              </ul>
            </div>
          )}

          <div className="input-group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={`variable-input variable-input${themeMode}`}
              placeholder="Enter a variable name"
              disabled={isSimulating}
            />
            <button
              onClick={validateVariable}
              disabled={!input || isSimulating}
              className={`action-btn validate-btn ${(!input || isSimulating) ? 'validate-btn-disabled' : ''}`}
            >
              {isSimulating ? 'Processing...' : 'Validate'}
            </button>
            <button
              onClick={resetSimulation}
              className={`action-btn reset-btn${themeMode}`}
            >
              Reset
            </button>
          </div>

          {/* Added variable description input */}
          <div className="input-group mt-4">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`variable-input variable-input${themeMode}`}
              placeholder="Describe what this variable represents (optional)"
              disabled={isSimulating}
            />
          </div>

          <div className="examples-container">
            <h3 className="examples-title">Try these examples:</h3>
            <div className="examples-buttons">
              {examplePresets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => usePreset(preset)}
                  className={`example-btn example-btn-${preset.valid ? 'valid' : 'invalid'}${themeMode}`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {input && (
            <div className="slider-container">
              <label className="slider-label">Animation Speed:</label>
              <div className="slider-wrapper">
                <span className="slider-text">Fast</span>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="100"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="slider"
                  disabled={isSimulating}
                />
                <span className="slider-text">Slow</span>
              </div>
            </div>
          )}
        </div>

        {/* Visual Representation of DFA */}
        <div className={`card card${themeMode}`}>
          <h2 className={`card-title card-title${themeMode}`}>
            Finite Automaton Visualization
          </h2>
          
          <div className="flex flex-col items-center">
            <div className="dfa-grid">
              <div className="state-container">
                <StateCircle 
                  id="q0" 
                  label="Start State" 
                  isActive={currentState === 'q0'} 
                  isAccept={false}
                  isReject={false} 
                />
                <div className="state-label">Initial State</div>
              </div>
              
              <div className="state-container">
                <StateCircle 
                  id="q1" 
                  label="Accept State" 
                  isActive={currentState === 'q1'} 
                  isAccept={true}
                  isReject={false} 
                />
                <div className="state-label">Valid Variable Names</div>
              </div>
              
              <div className="state-container">
                <StateCircle 
                  id="qR" 
                  label="Reject State" 
                  isActive={currentState === 'qR'} 
                  isAccept={false}
                  isReject={true} 
                />
                <div className="state-label">Invalid Input</div>
              </div>
            </div>
            
            {/* Transitions */}
            <div className={`transitions-panel transitions-panel${themeMode}`}>
              <h3 className="transitions-title">Transitions</h3>
              <div className="transitions-container">
                <div className="transition-group">
                  <div className="transition-state-label">From q0</div>
                  <div className="transition-list">
                    <div className="transition-item">
                      <span className={`transition-condition transition-condition${themeMode}`}>
                        letters, _
                      </span>
                      <TransitionArrow 
                        label="→ q1" 
                        isActive={activeTransition === 'letter_underscore' && steps.length > 0 && steps[steps.length-1].prevState === 'q0'}
                      />
                    </div>
                    <div className="transition-item">
                      <span className={`transition-condition transition-condition${themeMode}`}>
                        digits, other
                      </span>
                      <TransitionArrow 
                        label="→ qR" 
                        isActive={activeTransition === 'other' && steps.length > 0 && steps[steps.length-1].prevState === 'q0'}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="transition-group">
                  <div className="transition-state-label">From q1</div>
                  <div className="transition-list">
                    <div className="transition-item">
                      <span className={`transition-condition transition-condition${themeMode}`}>
                        letters, digits, _
                      </span>
                      <TransitionArrow 
                        label="→ q1" 
                        isActive={activeTransition === 'letter_digit_underscore' && steps.length > 0 && steps[steps.length-1].prevState === 'q1'}
                      />
                    </div>
                    <div className="transition-item">
                      <span className={`transition-condition transition-condition${themeMode}`}>
                        other
                      </span>
                      <TransitionArrow 
                        label="→ qR" 
                        isActive={activeTransition === 'other' && steps.length > 0 && steps[steps.length-1].prevState === 'q1'}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Character Visualization */}
        {input && (
          <div className={`card card${themeMode}`}>
            <h2 className={`card-title card-title${themeMode}`}>
              Input Analysis
            </h2>
            
            <div className="characters-container">
              {input.split('').map((char, index) => (
                <CharacterDisplay
                  key={index}
                  char={char}
                  status={getCharacterStatus(index)}
                />
              ))}
            </div>
            
            {steps.length > 0 && (
              <div className="overflow-x-auto mt-6">
                <table className={`steps-table steps-table${themeMode}`}>
                  <thead>
                    <tr>
                      <th className={`table-header table-header${themeMode}`}>Step</th>
                      <th className={`table-header table-header${themeMode}`}>Character</th>
                      <th className={`table-header table-header${themeMode}`}>From State</th>
                      <th className={`table-header table-header${themeMode}`}>To State</th>
                      <th className={`table-header table-header${themeMode}`}>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {steps.map((step, index) => {
                      let reasonText = '';
                      if (step.prevState === 'q0' && step.nextState === 'q1') {
                        reasonText = 'Valid first character (letter or underscore)';
                      } else if (step.prevState === 'q1' && step.nextState === 'q1') {
                        reasonText = 'Valid continuation (letter, digit, or underscore)';
                      } else if (step.prevState === 'q0' && step.nextState === 'qR') {
                        reasonText = 'Invalid first character (must be letter or underscore)';
                      } else if (step.prevState === 'q1' && step.nextState === 'qR') {
                        reasonText = 'Invalid character (only letters, digits, underscores allowed)';
                      } else if (step.prevState === 'qR') {
                        reasonText = 'Already rejected';
                      }
                      
                      const rowActiveClass = index === animationIndex - 1 ? `table-row-active${themeMode}` : '';
                      
                      return (
                        <tr key={index} className={rowActiveClass}>
                          <td className={`table-cell table-cell${themeMode} table-cell-center`}>{index + 1}</td>
                          <td className={`table-cell table-cell${themeMode} table-cell-center table-cell-mono`}>{step.char}</td>
                          <td className={`table-cell table-cell${themeMode} table-cell-center`}>{step.prevState}</td>
                          <td className={`table-cell table-cell${themeMode} table-cell-center
                            ${step.nextState === 'qR' 
                              ? `table-cell-invalid${themeMode}`
                              : `table-cell-valid${themeMode}`}`}>
                            {step.nextState}
                          </td>
                          <td className={`table-cell table-cell${themeMode}`}>{reasonText}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Recommendation Section - New Addition */}
        {!isSimulating && isValid === true && recommendation && (
          <div className={`card card${themeMode}`}>
            <h2 className={`card-title card-title${themeMode}`}>
              Name Quality Assessment
            </h2>
            
            <div className={`recommendation-box recommendation-box-${recommendation.score >= 3 ? 'good' : 'ok'}${themeMode}`}>
              <h3 className="recommendation-title">{recommendation.overall}</h3>
              
              <div className="recommendation-score">
                <span className="score-label">Quality Score: </span>
                <div className="score-meter">
                  {[...Array(5)].map((_, i) => (
                    <span 
                      key={i} 
                      className={`score-dot ${i < recommendation.score ? 'score-dot-filled' : 'score-dot-empty'}`}>
                      ●
                    </span>
                  ))}
                </div>
              </div>
              
              {recommendation.positives.length > 0 && (
                <div className="recommendation-section">
                  <h4 className="section-title positive-title">Strengths:</h4>
                  <ul className="recommendation-list">
                    {recommendation.positives.map((positive, idx) => (
                      <li key={idx} className="recommendation-item positive-item">
                        <span className="check-icon">✓</span> {positive}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {recommendation.recommendations.length > 0 && (
                <div className="recommendation-section">
                  <h4 className="section-title suggestion-title">Suggestions for improvement:</h4>
                  <ul className="recommendation-list">
                    {recommendation.recommendations.map((rec, idx) => (
                      <li key={idx} className="recommendation-item suggestion-item">
                        <span className="suggestion-icon">→</span> {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="naming-conventions">
                <h4 className="conventions-title">Common Naming Conventions:</h4>
                <ul className="conventions-list">
                  <li><strong>camelCase</strong>: First word lowercase, subsequent words capitalized (e.g., firstName)</li>
                  <li><strong>PascalCase</strong>: All words capitalized (e.g., FirstName) - typically for classes</li>
                  <li><strong>snake_case</strong>: Words separated by underscores (e.g., first_name)</li>
                  <li><strong>UPPER_SNAKE_CASE</strong>: All caps with underscores - typically for constants (e.g., MAX_SIZE)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Verdict */}
        {!isSimulating && isValid !== null && (
          <div className={`verdict-container ${isValid 
            ? `verdict-valid${themeMode}` 
            : `verdict-invalid${themeMode}`}`}>
            <div className="verdict-title">
              {isValid ? '✅ Valid Variable Name' : '❌ Invalid Variable Name'}
            </div>
            <p>
              {isValid 
                ? `"${input}" follows all the rules for a valid variable name.` 
                : `"${input}" does not meet the requirements for a valid variable name.`}
            </p>
            {!isValid && steps.length > 0 && (
              <div className="verdict-error">
                <strong>Issue detected:</strong> {
                  steps.find(step => step.nextState === 'qR')?.prevState === 'q0'
                    ? "Variable names must start with a letter or underscore."
                    : "Variable names can only contain letters, digits, and underscores."
                }
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className={`footer footer${themeMode}`}>
          <p>Finite Automaton Simulator for Variable Name Validation</p>
          <p className="footer-text">Created for Programming Language Syntax Checking</p>
        </div>
      </div>
    </div>
  );
}