'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { getDonors, getDivisionForDistrict, isDonorEligible } from '@/lib/donors';
import { BANGLADESH_DATA } from '@/data/bangladeshData';
import { BLOOD_GROUPS } from '@/data/seedDonors';
import styles from './Chatbot.module.css';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(true);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  
  // Selection states
  const [bloodGroup, setBloodGroup] = useState('');
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [area, setArea] = useState('');
  
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typing]);

  // Welcome flow on opening
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setTooltipVisible(false);
      startWelcomeFlow();
    }
  }, [isOpen, messages]);

  const addMessage = (message) => {
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), ...message }]);
  };

  const simulateTyping = (callback, delay = 800) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      callback();
    }, delay);
  };

  const startWelcomeFlow = () => {
    simulateTyping(() => {
      addMessage({
        sender: 'bot',
        type: 'text',
        text: '👋 Hello! I am your RedpulseBD Assistant. Let me help you find matching blood donors nearby in seconds.',
      });
      
      simulateTyping(() => {
        addMessage({
          sender: 'bot',
          type: 'options',
          text: 'To get started, what **Blood Group** do you need?',
          options: BLOOD_GROUPS,
          step: 'BLOOD_GROUP',
        });
      }, 700);
    }, 600);
  };

  const handleOptionSelect = (option, step) => {
    // Add user response message
    addMessage({
      sender: 'user',
      type: 'text',
      text: option,
    });

    if (step === 'BLOOD_GROUP') {
      setBloodGroup(option);
      simulateTyping(() => {
        const divisions = Object.keys(BANGLADESH_DATA);
        addMessage({
          sender: 'bot',
          type: 'options',
          text: `Got it, ${option}. Which **Division** are you in?`,
          options: divisions,
          step: 'DIVISION',
        });
      });
    } else if (step === 'DIVISION') {
      setDivision(option);
      simulateTyping(() => {
        const districts = Object.keys(BANGLADESH_DATA[option].districts);
        addMessage({
          sender: 'bot',
          type: 'options',
          text: 'Perfect. Now choose your **District**:',
          options: districts,
          step: 'DISTRICT',
        });
      });
    } else if (step === 'DISTRICT') {
      setDistrict(option);
      simulateTyping(() => {
        const areas = BANGLADESH_DATA[division]?.districts[option] || [];
        addMessage({
          sender: 'bot',
          type: 'area_form',
          text: 'Almost done! Select your **local Area** from the list below to complete the search:',
          data: { areas },
        });
      });
    }
  };

  const handleAreaSubmit = (selectedArea) => {
    setArea(selectedArea);
    
    addMessage({
      sender: 'user',
      type: 'text',
      text: selectedArea === 'all' ? 'All Areas' : selectedArea,
    });

    simulateTyping(async () => {
      addMessage({
        sender: 'bot',
        type: 'text',
        text: '🔍 Searching database for active, eligible donors matching your criteria...',
      });

      try {
        const allDonors = await getDonors({});
        // Filter locally
        const matchingDonors = allDonors.filter((donor) => {
          // Blood Group match
          if (donor.bloodGroup !== bloodGroup) return false;
          
          // Division match
          const donorDivision = donor.division || getDivisionForDistrict(donor.district);
          if (donorDivision !== division) return false;
          
          // District match
          const donorDistrict = donor.district || 'Dhaka';
          if (donorDistrict !== district) return false;
          
          // Area match (if not 'all')
          if (selectedArea !== 'all') {
            const matchPrimary = donor.area === selectedArea;
            const matchAvailable = Array.isArray(donor.areas) && donor.areas.includes(selectedArea);
            if (!matchPrimary && !matchAvailable) return false;
          }
          
          // Availability and Eligibility
          if (!donor.available || !isDonorEligible(donor.lastDonation)) return false;
          
          return true;
        });

        simulateTyping(() => {
          if (matchingDonors.length > 0) {
            addMessage({
              sender: 'bot',
              type: 'results',
              text: `🎉 I found ${matchingDonors.length} active, eligible ${bloodGroup} donor(s) in ${selectedArea === 'all' ? district : selectedArea}! Here they are:`,
              data: { donors: matchingDonors.slice(0, 3) }, // limit to 3 inside chat for neatness
            });
          } else {
            addMessage({
              sender: 'bot',
              type: 'text',
              text: `⚠️ No active ${bloodGroup} donors found directly in ${selectedArea === 'all' ? district : selectedArea} right now.`,
            });
            simulateTyping(() => {
              addMessage({
                sender: 'bot',
                type: 'text',
                text: '💡 *Tip*: You can post an emergency request on our site or search other neighboring areas.',
              }, 600);
            }, 500);
          }
          
          // Add restart option
          simulateTyping(() => {
            addMessage({
              sender: 'bot',
              type: 'reset',
            });
          }, 800);
        }, 1000);

      } catch (err) {
        console.error('Chatbot search error:', err);
        addMessage({
          sender: 'bot',
          type: 'text',
          text: '❌ Apologies, I encountered an error while searching. Please try again.',
        });
      }
    }, 1200);
  };

  const handleReset = () => {
    setMessages([]);
    setBloodGroup('');
    setDivision('');
    setDistrict('');
    setArea('');
    startWelcomeFlow();
  };

  return (
    <div className={styles.chatbotWrapper}>
      {/* Floating Action Button (FAB) Launcher */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`${styles.launcher} ${isOpen ? styles.launcherActive : ''}`}
        aria-label="Toggle chatbot assistant"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className={styles.pulseRing} />
          </>
        )}
      </button>

      {/* Tooltip hint */}
      {!isOpen && tooltipVisible && (
        <div className={styles.tooltip}>
          🆘 Need Blood? Chat Now
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={styles.window}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.botInfo}>
              <div className={styles.botLogo}>
                <Image
                  src="/images/logo.png"
                  alt="RedpulseBD Logo"
                  width={14}
                  height={21}
                  priority
                />
              </div>
              <div className={styles.botDetails}>
                <span className={styles.botName}>RedpulseBD Helper</span>
                <span className={styles.botStatus}>
                  <span className={styles.statusIndicator} />
                  Online
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className={styles.closeBtn} aria-label="Close chat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className={styles.messages}>
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`${styles.message} ${msg.sender === 'bot' ? styles.botMsg : styles.userMsg}`}
              >
                {msg.type === 'text' && (
                  <div className={`${styles.bubble} ${msg.sender === 'bot' ? styles.botBubble : styles.userBubble}`}>
                    {msg.text}
                  </div>
                )}

                {msg.type === 'options' && (
                  <>
                    <div className={`${styles.bubble} ${styles.botBubble}`}>
                      {msg.text}
                    </div>
                    <div className={styles.options}>
                      {msg.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleOptionSelect(opt, msg.step)}
                          className={styles.optionBtn}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {msg.type === 'area_form' && (
                  <>
                    <div className={`${styles.bubble} ${styles.botBubble}`}>
                      {msg.text}
                    </div>
                    <AreaForm 
                      areas={msg.data.areas} 
                      onSubmit={handleAreaSubmit} 
                    />
                  </>
                )}

                {msg.type === 'results' && (
                  <>
                    <div className={`${styles.bubble} ${styles.botBubble}`}>
                      {msg.text}
                    </div>
                    <div className={styles.resultsContainer}>
                      {msg.data.donors.map((donor) => (
                        <div key={donor.id} className={styles.donorCard}>
                          <div className={styles.donorHeader}>
                            <div className={styles.donorNameBox}>
                              <span className={styles.donorName}>{donor.name}</span>
                              <span className={styles.donorLocation}>{donor.area}, {donor.district}</span>
                            </div>
                            <span className={styles.badge}>Active</span>
                          </div>
                          <a href={`tel:${donor.phone}`} className={styles.callBtn}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                            </svg>
                            Call {donor.phone}
                          </a>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {msg.type === 'reset' && (
                  <button onClick={handleReset} className={styles.resetBtn}>
                    🔄 Start New Search
                  </button>
                )}
                
                <span className={styles.timestamp}>
                  {new Date(msg.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {/* Typing Indicator */}
            {typing && (
              <div className={`${styles.message} ${styles.botMsg}`}>
                <div className={`${styles.bubble} ${styles.botBubble} ${styles.typingIndicator}`}>
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Area Selection Form component
function AreaForm({ areas, onSubmit }) {
  const [selected, setSelected] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selected) {
      onSubmit(selected);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.areaForm}>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className={styles.select}
        required
      >
        <option value="">-- Select Area --</option>
        <option value="all">All Areas in District</option>
        {areas.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
      <button type="submit" className={styles.submitBtn}>
        Submit Area
      </button>
    </form>
  );
}
