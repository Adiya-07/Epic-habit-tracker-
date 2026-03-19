import React, { useState, useEffect } from 'react';
import { Sword, Heart, Sparkles, Zap, Shield, Target, TrendingUp, Calendar, Clock, Flame, Award, Star, Plus, Edit2, Trash2, Check, X, RotateCcw, ChevronDown, ChevronUp, BarChart3, Trophy, Gift, Bell, Menu, Home, User, Settings, Book, Pause, Play, Archive, MessageSquare, Image, Crown, Gem, Coins } from 'lucide-react';

export default function EpicHabitRPG() {
  // Core State
  const [habits, setHabits] = useState([]);
  const [character, setCharacter] = useState({
    name: 'Adventurer',
    title: 'Novice',
    level: 1,
    xp: 0,
    xpToNext: 100,
    stats: { 
      strength: 10, 
      charm: 10, 
      wisdom: 10, 
      vitality: 10,
      agility: 10,
      luck: 10
    },
    gold: 0,
    gems: 0,
    achievements: [],
    avatar: '🧙'
  });

  // UI State
  const [view, setView] = useState('today');
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notification, setNotification] = useState(null);
  const [expandedHabit, setExpandedHabit] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showAchievement, setShowAchievement] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [dailyQuote, setDailyQuote] = useState('');

  // Stats State
  const [stats, setStats] = useState({
    totalCompletions: 0,
    currentStreak: 0,
    longestStreak: 0,
    perfectDays: 0,
    totalDaysTracked: 0,
    categoryBreakdown: {},
    monthlyProgress: {}
  });

  // Initialize
  useEffect(() => {
    loadData();
    checkDailyReset();
    setDailyQuote(getMotivationalQuote());
    
    const interval = setInterval(checkDailyReset, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-save
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveData();
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [habits, character, stats]);

  // Update stats when habits change
  useEffect(() => {
    calculateStats();
  }, [habits]);

  const loadData = async () => {
    try {
      const [habitsRes, charRes, statsRes, settingsRes] = await Promise.all([
        window.storage.get('epic_habits').catch(() => null),
        window.storage.get('epic_character').catch(() => null),
        window.storage.get('epic_stats').catch(() => null),
        window.storage.get('epic_settings').catch(() => null)
      ]);

      if (habitsRes?.value) setHabits(JSON.parse(habitsRes.value));
      if (charRes?.value) setCharacter(JSON.parse(charRes.value));
      if (statsRes?.value) setStats(JSON.parse(statsRes.value));
      if (settingsRes?.value) {
        const settings = JSON.parse(settingsRes.value);
        setSoundEnabled(settings.soundEnabled ?? true);
        setDarkMode(settings.darkMode ?? true);
      }
    } catch (error) {
      console.log('Starting fresh adventure!');
    }
  };

  const saveData = async () => {
    try {
      await Promise.all([
        window.storage.set('epic_habits', JSON.stringify(habits)),
        window.storage.set('epic_character', JSON.stringify(character)),
        window.storage.set('epic_stats', JSON.stringify(stats)),
        window.storage.set('epic_settings', JSON.stringify({ soundEnabled, darkMode }))
      ]);
    } catch (error) {
      console.error('Save failed:', error);
      showNotification('⚠️ Failed to save progress!', 'error');
    }
  };

  const checkDailyReset = () => {
    const lastReset = localStorage.getItem('lastReset');
    const today = new Date().toISOString().split('T')[0];
    
    if (lastReset !== today) {
      resetDailyHabits();
      localStorage.setItem('lastReset', today);
      setDailyQuote(getMotivationalQuote());
    }
  };

  const resetDailyHabits = () => {
    setHabits(prev => prev.map(habit => {
      if (habit.frequency === 'daily' && !habit.archived) {
        // Check if habit was completed yesterday for streak
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const wasCompletedYesterday = habit.completedDates.includes(yesterday);
        
        return {
          ...habit,
          completedToday: false,
          streak: wasCompletedYesterday ? habit.streak : 0
        };
      }
      return habit;
    }));
  };

  const calculateStats = () => {
    const totalCompletions = habits.reduce((sum, h) => sum + h.totalCompletions, 0);
    const currentStreak = Math.max(...habits.map(h => h.streak), 0);
    const longestStreak = Math.max(...habits.map(h => h.longestStreak), 0);
    
    const allDates = [...new Set(habits.flatMap(h => h.completedDates))].sort();
    let perfectDays = 0;
    allDates.forEach(date => {
      const activeHabitsOnDate = habits.filter(h => 
        !h.archived && new Date(h.createdAt).toISOString().split('T')[0] <= date
      ).length;
      const completedOnDate = habits.filter(h => h.completedDates.includes(date)).length;
      if (activeHabitsOnDate > 0 && activeHabitsOnDate === completedOnDate) {
        perfectDays++;
      }
    });

    const categoryBreakdown = habits.reduce((acc, h) => {
      acc[h.category] = (acc[h.category] || 0) + h.totalCompletions;
      return acc;
    }, {});

    setStats({
      totalCompletions,
      currentStreak,
      longestStreak,
      perfectDays,
      totalDaysTracked: allDates.length,
      categoryBreakdown,
      monthlyProgress: {}
    });
  };

  const addHabit = (habitData) => {
    const newHabit = {
      id: Date.now(),
      ...habitData,
      createdAt: new Date().toISOString(),
      streak: 0,
      longestStreak: 0,
      completedToday: false,
      completedDates: [],
      skippedDates: [],
      failedDates: [],
      totalCompletions: 0,
      notes: [],
      archived: false,
      paused: false
    };
    
    setHabits(prev => [...prev, newHabit]);
    setShowAddHabit(false);
    showNotification('⚔️ New quest accepted!', 'success');
  };

  const completeHabit = (habitId) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || habit.completedToday || habit.paused || habit.archived) return;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    let newStreak = 1;
    if (habit.completedDates.length > 0) {
      const lastCompleted = habit.completedDates[habit.completedDates.length - 1];
      if (lastCompleted === yesterday) {
        newStreak = habit.streak + 1;
      }
    }

    const updatedHabit = {
      ...habit,
      completedToday: true,
      completedDates: [...habit.completedDates, today],
      totalCompletions: habit.totalCompletions + 1,
      streak: newStreak,
      longestStreak: Math.max(newStreak, habit.longestStreak)
    };

    setHabits(prev => prev.map(h => h.id === habitId ? updatedHabit : h));

    // Calculate rewards
    const xpGain = calculateXPGain(habit);
    const goldGain = Math.floor(xpGain / 5);
    const statGains = calculateStatGains(habit);

    gainXP(xpGain, goldGain, statGains);
    checkStreakAchievements(newStreak);
    
    showNotification(`+${xpGain} XP | +${goldGain} Gold | Quest Complete! 🎯`, 'success');
  };

  const uncompleteHabit = (habitId) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || !habit.completedToday) return;

    const today = new Date().toISOString().split('T')[0];
    
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        return {
          ...h,
          completedToday: false,
          completedDates: h.completedDates.filter(d => d !== today),
          totalCompletions: Math.max(0, h.totalCompletions - 1)
        };
      }
      return h;
    }));

    showNotification('Quest progress reversed', 'warning');
  };

  const skipHabit = (habitId) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || habit.completedToday) return;

    const today = new Date().toISOString().split('T')[0];
    
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        return {
          ...h,
          skippedDates: [...h.skippedDates, today],
          completedToday: true // Mark as handled for the day
        };
      }
      return h;
    }));

    showNotification('Quest skipped for today', 'info');
  };

  const failHabit = (habitId) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const today = new Date().toISOString().split('T')[0];
    
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        return {
          ...h,
          failedDates: [...h.failedDates, today],
          streak: 0,
          completedToday: true
        };
      }
      return h;
    }));

    showNotification('Streak broken! Time to rebuild 💪', 'warning');
  };

  const calculateXPGain = (habit) => {
    let baseXP = 20;
    
    // Difficulty multiplier
    const diffMultiplier = {
      easy: 1,
      medium: 1.5,
      hard: 2,
      extreme: 3
    };
    baseXP *= diffMultiplier[habit.difficulty] || 1;

    // Streak bonus
    if (habit.streak >= 7) baseXP += 10;
    if (habit.streak >= 30) baseXP += 20;
    if (habit.streak >= 100) baseXP += 50;

    // Priority bonus
    if (habit.priority === 'high') baseXP *= 1.2;
    if (habit.priority === 'critical') baseXP *= 1.5;

    return Math.floor(baseXP);
  };

  const calculateStatGains = (habit) => {
    const gains = {};
    const statMap = {
      strength: habit.statBoost?.strength || 0,
      charm: habit.statBoost?.charm || 0,
      wisdom: habit.statBoost?.wisdom || 0,
      vitality: habit.statBoost?.vitality || 0,
      agility: habit.statBoost?.agility || 0,
      luck: habit.statBoost?.luck || 0
    };
    
    Object.keys(statMap).forEach(stat => {
      if (statMap[stat] > 0) {
        gains[stat] = 1;
      }
    });
    
    return gains;
  };

  const gainXP = (xp, gold, statGains) => {
    setCharacter(prev => {
      let newXP = prev.xp + xp;
      let newLevel = prev.level;
      let newXPToNext = prev.xpToNext;
      let leveledUp = false;

      // Level up logic
      while (newXP >= newXPToNext) {
        newXP -= newXPToNext;
        newLevel += 1;
        newXPToNext = Math.floor(newXPToNext * 1.5);
        leveledUp = true;
      }

      // Update stats
      const newStats = { ...prev.stats };
      Object.keys(statGains).forEach(stat => {
        newStats[stat] += statGains[stat];
      });

      // Update title based on level
      const newTitle = getTitleForLevel(newLevel);

      const updated = {
        ...prev,
        xp: newXP,
        level: newLevel,
        xpToNext: newXPToNext,
        gold: prev.gold + gold,
        stats: newStats,
        title: newTitle
      };

      if (leveledUp) {
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 4000);
        checkLevelAchievements(newLevel);
      }

      return updated;
    });
  };

  const getTitleForLevel = (level) => {
    if (level >= 100) return 'Legendary Hero';
    if (level >= 75) return 'Master of Habits';
    if (level >= 50) return 'Champion';
    if (level >= 30) return 'Veteran Warrior';
    if (level >= 20) return 'Skilled Adventurer';
    if (level >= 10) return 'Apprentice';
    return 'Novice';
  };

  const checkStreakAchievements = (streak) => {
    const achievements = [
      { id: 'streak_7', name: 'Week Warrior', desc: '7 day streak', threshold: 7, icon: '🔥' },
      { id: 'streak_30', name: 'Monthly Master', desc: '30 day streak', threshold: 30, icon: '💎' },
      { id: 'streak_100', name: 'Century Club', desc: '100 day streak', threshold: 100, icon: '👑' },
      { id: 'streak_365', name: 'Year Legend', desc: '365 day streak', threshold: 365, icon: '⭐' }
    ];

    achievements.forEach(ach => {
      if (streak === ach.threshold && !character.achievements.includes(ach.id)) {
        unlockAchievement(ach);
      }
    });
  };

  const checkLevelAchievements = (level) => {
    const milestones = [
      { id: 'level_10', name: 'Rising Star', desc: 'Reached level 10', threshold: 10, icon: '⭐', reward: 100 },
      { id: 'level_25', name: 'Power Player', desc: 'Reached level 25', threshold: 25, icon: '💪', reward: 250 },
      { id: 'level_50', name: 'Half Century', desc: 'Reached level 50', threshold: 50, icon: '🏆', reward: 500 },
      { id: 'level_100', name: 'Centurion', desc: 'Reached level 100', threshold: 100, icon: '👑', reward: 1000 }
    ];

    milestones.forEach(milestone => {
      if (level === milestone.threshold && !character.achievements.includes(milestone.id)) {
        unlockAchievement(milestone);
        if (milestone.reward) {
          setCharacter(prev => ({ ...prev, gold: prev.gold + milestone.reward }));
        }
      }
    });
  };

  const unlockAchievement = (achievement) => {
    setCharacter(prev => ({
      ...prev,
      achievements: [...prev.achievements, achievement.id]
    }));
    setShowAchievement(achievement);
    setTimeout(() => setShowAchievement(null), 4000);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getMotivationalQuote = () => {
    const quotes = [
      "Today is your epic quest!",
      "Small victories lead to legendary achievements!",
      "Every hero starts with a single step!",
      "Your future self will thank you!",
      "Consistency is your superpower!",
      "Level up your life, one habit at a time!",
      "Champions are made in daily battles!",
      "Progress, not perfection!",
      "You're stronger than yesterday!",
      "Make today count, warrior!"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  const addNoteToHabit = (habitId, note) => {
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        return {
          ...h,
          notes: [...h.notes, {
            id: Date.now(),
            text: note,
            date: new Date().toISOString()
          }]
        };
      }
      return h;
    }));
  };

  const togglePauseHabit = (habitId) => {
    setHabits(prev => prev.map(h => 
      h.id === habitId ? { ...h, paused: !h.paused } : h
    ));
  };

  const toggleArchiveHabit = (habitId) => {
    setHabits(prev => prev.map(h => 
      h.id === habitId ? { ...h, archived: !h.archived } : h
    ));
  };

  const getFilteredHabits = () => {
    let filtered = habits.filter(h => {
      if (filter === 'active') return !h.archived && !h.paused;
      if (filter === 'paused') return h.paused;
      if (filter === 'archived') return h.archived;
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (sortBy === 'streak') return b.streak - a.streak;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'category') return a.category.localeCompare(b.category);
      return 0;
    });

    return filtered;
  };

  // Render Functions
  const renderCharacterPanel = () => (
    <div className="character-panel">
      <div className="character-header">
        <div className="avatar-large">{character.avatar}</div>
        <div className="character-info">
          <h2>{character.name}</h2>
          <p className="title">{character.title}</p>
          <div className="level-badge">Level {character.level}</div>
        </div>
      </div>

      <div className="xp-bar-container">
        <div className="xp-bar">
          <div 
            className="xp-fill" 
            style={{ width: `${(character.xp / character.xpToNext) * 100}%` }}
          />
        </div>
        <span className="xp-text">{character.xp} / {character.xpToNext} XP</span>
      </div>

      <div className="resources">
        <div className="resource">
          <Coins className="icon" />
          <span>{character.gold}</span>
        </div>
        <div className="resource gem">
          <Gem className="icon" />
          <span>{character.gems}</span>
        </div>
      </div>

      <div className="stats-grid">
        {Object.entries(character.stats).map(([stat, value]) => (
          <div key={stat} className="stat-item">
            <div className="stat-icon">
              {stat === 'strength' && <Sword />}
              {stat === 'charm' && <Sparkles />}
              {stat === 'wisdom' && <Book />}
              {stat === 'vitality' && <Heart />}
              {stat === 'agility' && <Zap />}
              {stat === 'luck' && <Star />}
            </div>
            <div className="stat-info">
              <span className="stat-name">{stat}</span>
              <span className="stat-value">{value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="achievements-section">
        <h3><Trophy className="icon" /> Achievements ({character.achievements.length})</h3>
        <div className="achievements-grid">
          {character.achievements.length === 0 ? (
            <p className="empty-state">Complete quests to unlock achievements!</p>
          ) : (
            character.achievements.map(achId => (
              <div key={achId} className="achievement-badge">
                🏆
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderHabitCard = (habit) => {
    const isExpanded = expandedHabit === habit.id;
    const canComplete = !habit.completedToday && !habit.paused && !habit.archived;

    return (
      <div key={habit.id} className={`habit-card ${habit.completedToday ? 'completed' : ''} ${habit.paused ? 'paused' : ''} ${habit.archived ? 'archived' : ''} priority-${habit.priority}`}>
        <div className="habit-main">
          <div className="habit-left">
            <button 
              className={`complete-btn ${habit.completedToday ? 'checked' : ''}`}
              onClick={() => habit.completedToday ? uncompleteHabit(habit.id) : completeHabit(habit.id)}
              disabled={!canComplete && !habit.completedToday}
            >
              {habit.completedToday ? <Check /> : <div className="empty-circle" />}
            </button>
            
            <div className="habit-content">
              <div className="habit-title-row">
                <h3>{habit.name}</h3>
                {habit.streak > 0 && (
                  <div className="streak-badge">
                    <Flame className="icon" />
                    <span>{habit.streak}</span>
                  </div>
                )}
              </div>
              
              <div className="habit-meta">
                <span className="category">{habit.category}</span>
                <span className="difficulty">{habit.difficulty}</span>
                <span className="frequency">{habit.frequency}</span>
              </div>

              {habit.description && (
                <p className="habit-description">{habit.description}</p>
              )}

              <div className="habit-stats-mini">
                <span>✅ {habit.totalCompletions}</span>
                <span>🔥 Best: {habit.longestStreak}</span>
                {habit.targetDays && (
                  <span>🎯 {habit.completedDates.length}/{habit.targetDays}</span>
                )}
              </div>
            </div>
          </div>

          <div className="habit-actions">
            <button onClick={() => setExpandedHabit(isExpanded ? null : habit.id)} className="icon-btn">
              {isExpanded ? <ChevronUp /> : <ChevronDown />}
            </button>
            <button onClick={() => setEditingHabit(habit)} className="icon-btn">
              <Edit2 />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="habit-expanded">
            <div className="expanded-actions">
              <button onClick={() => skipHabit(habit.id)} className="action-btn skip">
                <Clock className="icon" /> Skip Today
              </button>
              <button onClick={() => togglePauseHabit(habit.id)} className="action-btn pause">
                {habit.paused ? <Play className="icon" /> : <Pause className="icon" />}
                {habit.paused ? 'Resume' : 'Pause'}
              </button>
              <button onClick={() => toggleArchiveHabit(habit.id)} className="action-btn archive">
                <Archive className="icon" /> {habit.archived ? 'Unarchive' : 'Archive'}
              </button>
              <button onClick={() => deleteHabit(habit.id)} className="action-btn delete">
                <Trash2 className="icon" /> Delete
              </button>
            </div>

            <div className="habit-calendar">
              <h4>Last 30 Days</h4>
              <div className="mini-calendar">
                {Array.from({ length: 30 }).map((_, i) => {
                  const date = new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0];
                  const completed = habit.completedDates.includes(date);
                  const skipped = habit.skippedDates.includes(date);
                  const failed = habit.failedDates.includes(date);
                  
                  return (
                    <div 
                      key={i} 
                      className={`calendar-day ${completed ? 'completed' : ''} ${skipped ? 'skipped' : ''} ${failed ? 'failed' : ''}`}
                      title={date}
                    />
                  );
                })}
              </div>
            </div>

            {habit.notes.length > 0 && (
              <div className="habit-notes">
                <h4><MessageSquare className="icon" /> Notes</h4>
                {habit.notes.map(note => (
                  <div key={note.id} className="note-item">
                    <small>{new Date(note.date).toLocaleDateString()}</small>
                    <p>{note.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderHabitForm = (habit = null) => {
    const [formData, setFormData] = useState(habit || {
      name: '',
      description: '',
      category: 'health',
      frequency: 'daily',
      difficulty: 'medium',
      priority: 'medium',
      statBoost: { strength: 0, charm: 0, wisdom: 0, vitality: 0, agility: 0, luck: 0 },
      reminder: null,
      targetDays: null,
      icon: '⭐'
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.name) return;
      
      if (habit) {
        updateHabit(habit.id, formData);
      } else {
        addHabit(formData);
      }
    };

    const updateHabit = (id, updates) => {
      setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
      setEditingHabit(null);
      showNotification('✏️ Quest updated!', 'success');
    };

    return (
      <div className="modal-overlay" onClick={() => habit ? setEditingHabit(null) : setShowAddHabit(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h2>{habit ? 'Edit Quest' : 'New Quest'}</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Quest Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="E.g., Morning Meditation"
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="What does this quest involve?"
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="health">🏃 Health</option>
                  <option value="fitness">💪 Fitness</option>
                  <option value="mind">🧠 Mind</option>
                  <option value="productivity">⚡ Productivity</option>
                  <option value="social">👥 Social</option>
                  <option value="creativity">🎨 Creativity</option>
                  <option value="learning">📚 Learning</option>
                  <option value="finance">💰 Finance</option>
                  <option value="lifestyle">✨ Lifestyle</option>
                  <option value="other">🎯 Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                >
                  <option value="easy">Easy (1x XP)</option>
                  <option value="medium">Medium (1.5x XP)</option>
                  <option value="hard">Hard (2x XP)</option>
                  <option value="extreme">Extreme (3x XP)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Stat Boosts (Choose which stats this quest improves)</label>
              <div className="stat-toggles">
                {Object.keys(formData.statBoost).map(stat => (
                  <label key={stat} className="stat-toggle">
                    <input
                      type="checkbox"
                      checked={formData.statBoost[stat] > 0}
                      onChange={e => setFormData({
                        ...formData,
                        statBoost: {
                          ...formData.statBoost,
                          [stat]: e.target.checked ? 1 : 0
                        }
                      })}
                    />
                    <span className="stat-label">
                      {stat === 'strength' && <Sword className="icon" />}
                      {stat === 'charm' && <Sparkles className="icon" />}
                      {stat === 'wisdom' && <Book className="icon" />}
                      {stat === 'vitality' && <Heart className="icon" />}
                      {stat === 'agility' && <Zap className="icon" />}
                      {stat === 'luck' && <Star className="icon" />}
                      {stat.charAt(0).toUpperCase() + stat.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Target Days (Optional)</label>
              <input
                type="number"
                value={formData.targetDays || ''}
                onChange={e => setFormData({ ...formData, targetDays: parseInt(e.target.value) || null })}
                placeholder="E.g., 30 for a 30-day challenge"
                min="1"
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => habit ? setEditingHabit(null) : setShowAddHabit(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {habit ? 'Save Changes' : 'Create Quest'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderStatsView = () => (
    <div className="stats-view">
      <h2><BarChart3 className="icon" /> Statistics</h2>
      
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon"><Check /></div>
          <div className="stat-content">
            <h3>{stats.totalCompletions}</h3>
            <p>Total Completions</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><Flame /></div>
          <div className="stat-content">
            <h3>{stats.currentStreak}</h3>
            <p>Current Streak</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><Trophy /></div>
          <div className="stat-content">
            <h3>{stats.longestStreak}</h3>
            <p>Longest Streak</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><Star /></div>
          <div className="stat-content">
            <h3>{stats.perfectDays}</h3>
            <p>Perfect Days</p>
          </div>
        </div>
      </div>

      <div className="category-breakdown">
        <h3>Completions by Category</h3>
        <div className="category-bars">
          {Object.entries(stats.categoryBreakdown).map(([category, count]) => {
            const maxCount = Math.max(...Object.values(stats.categoryBreakdown));
            const percentage = (count / maxCount) * 100;
            
            return (
              <div key={category} className="category-bar-item">
                <span className="category-label">{category}</span>
                <div className="category-bar-container">
                  <div className="category-bar-fill" style={{ width: `${percentage}%` }} />
                </div>
                <span className="category-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="habit-breakdown">
        <h3>Habit Performance</h3>
        <div className="habit-list-stats">
          {habits.filter(h => !h.archived).map(habit => (
            <div key={habit.id} className="habit-stat-row">
              <span className="habit-name">{habit.name}</span>
              <div className="habit-stat-bars">
                <div className="stat-mini">
                  <span>Completions: {habit.totalCompletions}</span>
                </div>
                <div className="stat-mini">
                  <span>Streak: {habit.streak}</span>
                </div>
                <div className="stat-mini">
                  <span>Best: {habit.longestStreak}</span>
                </div>
                {habit.targetDays && (
                  <div className="stat-mini">
                    <span>Progress: {Math.round((habit.completedDates.length / habit.targetDays) * 100)}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const deleteHabit = (id) => {
    if (confirm('Are you sure you want to delete this quest? This cannot be undone!')) {
      setHabits(prev => prev.filter(h => h.id !== id));
      showNotification('❌ Quest deleted', 'warning');
    }
  };

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      {/* Level Up Animation */}
      {showLevelUp && (
        <div className="level-up-overlay">
          <div className="level-up-content">
            <Crown className="level-up-icon" />
            <h1>LEVEL UP!</h1>
            <div className="level-display">Level {character.level}</div>
            <p className="title-unlock">{character.title}</p>
            <div className="sparkles">✨ ⭐ ✨</div>
          </div>
        </div>
      )}

      {/* Achievement Unlock */}
      {showAchievement && (
        <div className="achievement-unlock">
          <div className="achievement-content">
            <Trophy className="achievement-icon" />
            <div>
              <h3>Achievement Unlocked!</h3>
              <p>{showAchievement.icon} {showAchievement.name}</p>
              <small>{showAchievement.desc}</small>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1>⚔️ Epic Habit RPG</h1>
          <div className="header-quote">{dailyQuote}</div>
        </div>
        
        <div className="header-controls">
          <button 
            onClick={() => setDarkMode(!darkMode)} 
            className="icon-btn"
            title="Toggle theme"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)} 
            className="icon-btn"
            title="Toggle sound"
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-container">
        {/* Sidebar */}
        <aside className="sidebar">
          {renderCharacterPanel()}
          
          <div className="quick-stats">
            <div className="quick-stat">
              <Target className="icon" />
              <div>
                <span className="stat-value">{habits.filter(h => !h.archived && !h.paused).length}</span>
                <span className="stat-label">Active</span>
              </div>
            </div>
            <div className="quick-stat">
              <Flame className="icon" />
              <div>
                <span className="stat-value">{habits.filter(h => h.completedToday).length}</span>
                <span className="stat-label">Today</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="content">
          {/* Navigation */}
          <nav className="view-nav">
            <button 
              className={view === 'today' ? 'active' : ''} 
              onClick={() => setView('today')}
            >
              <Home className="icon" /> Today
            </button>
            <button 
              className={view === 'all' ? 'active' : ''} 
              onClick={() => setView('all')}
            >
              <Target className="icon" /> All Quests
            </button>
            <button 
              className={view === 'stats' ? 'active' : ''} 
              onClick={() => setView('stats')}
            >
              <BarChart3 className="icon" /> Stats
            </button>
          </nav>

          {/* Filters and Sort */}
          {(view === 'today' || view === 'all') && (
            <div className="controls-bar">
              <div className="filter-group">
                <select value={filter} onChange={e => setFilter(e.target.value)} className="filter-select">
                  <option value="all">All Habits</option>
                  <option value="active">Active Only</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>

                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="filter-select">
                  <option value="priority">Sort by Priority</option>
                  <option value="streak">Sort by Streak</option>
                  <option value="name">Sort by Name</option>
                  <option value="category">Sort by Category</option>
                </select>
              </div>

              <button onClick={() => setShowAddHabit(true)} className="btn-primary">
                <Plus className="icon" /> New Quest
              </button>
            </div>
          )}

          {/* Content Views */}
          <div className="view-content">
            {view === 'today' && (
              <div className="habits-container">
                {getFilteredHabits().filter(h => !h.archived && !h.paused).length === 0 ? (
                  <div className="empty-state">
                    <Target size={64} />
                    <h3>No active quests!</h3>
                    <p>Create your first habit to begin your adventure!</p>
                    <button onClick={() => setShowAddHabit(true)} className="btn-primary">
                      <Plus className="icon" /> Create Quest
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="today-progress">
                      <h3>Today's Progress</h3>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${(habits.filter(h => h.completedToday && !h.archived && !h.paused).length / habits.filter(h => !h.archived && !h.paused).length) * 100}%` 
                          }}
                        />
                      </div>
                      <p>{habits.filter(h => h.completedToday && !h.archived && !h.paused).length} / {habits.filter(h => !h.archived && !h.paused).length} completed</p>
                    </div>

                    {getFilteredHabits().filter(h => !h.archived && !h.paused).map(renderHabitCard)}
                  </>
                )}
              </div>
            )}

            {view === 'all' && (
              <div className="habits-container">
                {getFilteredHabits().length === 0 ? (
                  <div className="empty-state">
                    <Archive size={64} />
                    <h3>No quests found</h3>
                    <p>Try adjusting your filters or create a new quest!</p>
                  </div>
                ) : (
                  getFilteredHabits().map(renderHabitCard)
                )}
              </div>
            )}

            {view === 'stats' && renderStatsView()}
          </div>
        </main>
      </div>

      {/* Modals */}
      {showAddHabit && renderHabitForm()}
      {editingHabit && renderHabitForm(editingHabit)}

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .app {
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          transition: background-color 0.3s, color 0.3s;
        }

        .app.dark {
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
          color: #e0e0e0;
        }

        .app.light {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          color: #1a1a1a;
        }

        .app-header {
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          padding: 1.5rem 2rem;
          border-bottom: 2px solid rgba(255, 255, 255, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-content h1 {
          font-size: 2rem;
          font-weight: 800;
          background: linear-gradient(135deg, #ffd700, #ff6b6b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.25rem;
        }

        .header-quote {
          font-size: 0.9rem;
          opacity: 0.8;
          font-style: italic;
        }

        .header-controls {
          display: flex;
          gap: 0.5rem;
        }

        .main-container {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 2rem;
          padding: 2rem;
          max-width: 1600px;
          margin: 0 auto;
        }

        .sidebar {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          height: fit-content;
          position: sticky;
          top: 120px;
        }

        .character-panel {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .character-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .avatar-large {
          font-size: 4rem;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 50%;
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .character-info h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .title {
          color: #ffd700;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .level-badge {
          display: inline-block;
          background: linear-gradient(135deg, #f093fb, #f5576c);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .xp-bar-container {
          margin: 1rem 0;
        }

        .xp-bar {
          width: 100%;
          height: 24px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .xp-fill {
          height: 100%;
          background: linear-gradient(90deg, #4facfe, #00f2fe);
          transition: width 0.5s ease;
          box-shadow: 0 0 20px rgba(79, 172, 254, 0.6);
        }

        .xp-text {
          display: block;
          text-align: center;
          margin-top: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .resources {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .resource {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 215, 0, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 10px;
          border: 1px solid rgba(255, 215, 0, 0.3);
          font-weight: 600;
        }

        .resource.gem {
          background: rgba(138, 43, 226, 0.1);
          border-color: rgba(138, 43, 226, 0.3);
        }

        .resource .icon {
          width: 20px;
          height: 20px;
          color: #ffd700;
        }

        .resource.gem .icon {
          color: #8a2be2;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .stat-item {
          background: rgba(255, 255, 255, 0.05);
          padding: 1rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s;
        }

        .stat-item:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .stat-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 10px;
        }

        .stat-icon svg {
          width: 20px;
          height: 20px;
          color: white;
        }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-name {
          font-size: 0.75rem;
          opacity: 0.7;
          text-transform: uppercase;
          font-weight: 600;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #ffd700;
        }

        .achievements-section {
          margin-top: 1rem;
        }

        .achievements-section h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          font-size: 1rem;
        }

        .achievements-section .icon {
          width: 20px;
          height: 20px;
          color: #ffd700;
        }

        .achievements-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
        }

        .achievement-badge {
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 215, 0, 0.1);
          border: 2px solid rgba(255, 215, 0, 0.3);
          border-radius: 10px;
          font-size: 1.5rem;
          transition: all 0.3s;
        }

        .achievement-badge:hover {
          transform: scale(1.1) rotate(5deg);
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
        }

        .quick-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .quick-stat {
          background: rgba(255, 255, 255, 0.05);
          padding: 1rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .quick-stat .icon {
          width: 24px;
          height: 24px;
          color: #ffd700;
        }

        .quick-stat div {
          display: flex;
          flex-direction: column;
        }

        .quick-stat .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ffd700;
        }

        .quick-stat .stat-label {
          font-size: 0.75rem;
          opacity: 0.7;
        }

        .content {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          min-height: 600px;
        }

        .view-nav {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          border-bottom: 2px solid rgba(255, 255, 255, 0.1);
        }

        .view-nav button {
          background: none;
          border: none;
          color: inherit;
          padding: 1rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          opacity: 0.6;
          transition: all 0.3s;
          border-bottom: 3px solid transparent;
        }

        .view-nav button:hover {
          opacity: 0.8;
        }

        .view-nav button.active {
          opacity: 1;
          border-bottom-color: #ffd700;
        }

        .view-nav button .icon {
          width: 20px;
          height: 20px;
        }

        .controls-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .filter-select {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          color: inherit;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .filter-select:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .filter-select:focus {
          outline: none;
          border-color: #ffd700;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          border: none;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
        }

        .btn-primary .icon {
          width: 20px;
          height: 20px;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: inherit;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .view-content {
          animation: fadeIn 0.5s;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .habits-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .today-progress {
          background: rgba(255, 255, 255, 0.05);
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 1rem;
        }

        .today-progress h3 {
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }

        .progress-bar {
          width: 100%;
          height: 20px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4facfe, #00f2fe);
          transition: width 0.5s ease;
        }

        .today-progress p {
          text-align: center;
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .habit-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 1.5rem;
          border: 2px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }

        .habit-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 5px;
          height: 100%;
          transition: all 0.3s;
        }

        .habit-card.priority-critical::before {
          background: #ff4757;
        }

        .habit-card.priority-high::before {
          background: #ffa502;
        }

        .habit-card.priority-medium::before {
          background: #ffd700;
        }

        .habit-card.priority-low::before {
          background: #5f27cd;
        }

        .habit-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateX(5px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }

        .habit-card.completed {
          opacity: 0.7;
        }

        .habit-card.paused {
          opacity: 0.5;
          filter: grayscale(0.5);
        }

        .habit-card.archived {
          opacity: 0.4;
        }

        .habit-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .habit-left {
          display: flex;
          gap: 1rem;
          flex: 1;
        }

        .complete-btn {
          width: 44px;
          height: 44px;
          min-width: 44px;
          border-radius: 50%;
          border: 3px solid rgba(255, 255, 255, 0.3);
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          color: white;
        }

        .complete-btn:hover:not(:disabled) {
          border-color: #4facfe;
          background: rgba(79, 172, 254, 0.1);
          transform: scale(1.1);
        }

        .complete-btn.checked {
          background: linear-gradient(135deg, #4facfe, #00f2fe);
          border-color: #4facfe;
        }

        .complete-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .empty-circle {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.5);
        }

        .habit-content {
          flex: 1;
        }

        .habit-title-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .habit-title-row h3 {
          font-size: 1.2rem;
          font-weight: 600;
        }

        .streak-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .streak-badge .icon {
          width: 16px;
          height: 16px;
        }

        .habit-meta {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
        }

        .habit-meta span {
          font-size: 0.85rem;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .habit-description {
          font-size: 0.9rem;
          opacity: 0.8;
          margin-bottom: 0.75rem;
        }

        .habit-stats-mini {
          display: flex;
          gap: 1rem;
          font-size: 0.85rem;
          opacity: 0.7;
        }

        .habit-actions {
          display: flex;
          gap: 0.5rem;
        }

        .icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          color: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }

        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .icon-btn svg {
          width: 20px;
          height: 20px;
        }

        .habit-expanded {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          animation: slideDown 0.3s;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 1000px;
          }
        }

        .expanded-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          color: inherit;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .action-btn .icon {
          width: 16px;
          height: 16px;
        }

        .action-btn.delete {
          border-color: rgba(255, 71, 87, 0.3);
        }

        .action-btn.delete:hover {
          background: rgba(255, 71, 87, 0.1);
          border-color: rgba(255, 71, 87, 0.5);
        }

        .habit-calendar h4 {
          font-size: 0.95rem;
          margin-bottom: 0.75rem;
        }

        .mini-calendar {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 0.25rem;
        }

        .calendar-day {
          aspect-ratio: 1;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s;
          cursor: pointer;
        }

        .calendar-day:hover {
          transform: scale(1.1);
        }

        .calendar-day.completed {
          background: linear-gradient(135deg, #4facfe, #00f2fe);
          border-color: #4facfe;
        }

        .calendar-day.skipped {
          background: rgba(255, 193, 7, 0.3);
          border-color: rgba(255, 193, 7, 0.5);
        }

        .calendar-day.failed {
          background: rgba(255, 71, 87, 0.3);
          border-color: rgba(255, 71, 87, 0.5);
        }

        .habit-notes h4 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.95rem;
          margin-bottom: 0.75rem;
        }

        .habit-notes .icon {
          width: 16px;
          height: 16px;
        }

        .note-item {
          background: rgba(255, 255, 255, 0.05);
          padding: 0.75rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 0.5rem;
        }

        .note-item small {
          display: block;
          opacity: 0.6;
          margin-bottom: 0.25rem;
          font-size: 0.75rem;
        }

        .note-item p {
          font-size: 0.9rem;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          opacity: 0.7;
        }

        .empty-state svg {
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-state h3 {
          margin-bottom: 0.5rem;
          font-size: 1.5rem;
        }

        .empty-state p {
          margin-bottom: 1.5rem;
          opacity: 0.8;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          animation: fadeIn 0.3s;
        }

        .modal-content {
          background: rgba(30, 30, 30, 0.95);
          border-radius: 20px;
          padding: 2rem;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid rgba(255, 255, 255, 0.1);
          animation: slideUp 0.3s;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-content h2 {
          margin-bottom: 1.5rem;
          font-size: 1.75rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          padding: 0.75rem;
          color: inherit;
          font-size: 1rem;
          font-family: inherit;
          transition: all 0.3s;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #ffd700;
          background: rgba(255, 255, 255, 0.15);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .stat-toggles {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }

        .stat-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          padding: 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .stat-toggle input[type="checkbox"] {
          width: auto;
          cursor: pointer;
        }

        .stat-label {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.85rem;
        }

        .stat-label .icon {
          width: 16px;
          height: 16px;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
        }

        .stats-view {
          animation: fadeIn 0.5s;
        }

        .stats-view h2 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 2rem;
          font-size: 1.75rem;
        }

        .stats-view h2 .icon {
          width: 28px;
          height: 28px;
        }

        .stats-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          padding: 1.5rem;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.3s;
        }

        .stat-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }

        .stat-card .stat-icon {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 12px;
        }

        .stat-card .stat-icon svg {
          width: 30px;
          height: 30px;
          color: white;
        }

        .stat-content h3 {
          font-size: 2rem;
          font-weight: 700;
          color: #ffd700;
          margin-bottom: 0.25rem;
        }

        .stat-content p {
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .category-breakdown,
        .habit-breakdown {
          background: rgba(255, 255, 255, 0.05);
          padding: 2rem;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 2rem;
        }

        .category-breakdown h3,
        .habit-breakdown h3 {
          margin-bottom: 1.5rem;
          font-size: 1.25rem;
        }

        .category-bars {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .category-bar-item {
          display: grid;
          grid-template-columns: 120px 1fr 60px;
          align-items: center;
          gap: 1rem;
        }

        .category-label {
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .category-bar-container {
          height: 20px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          overflow: hidden;
        }

        .category-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #4facfe, #00f2fe);
          transition: width 0.5s ease;
        }

        .category-count {
          text-align: right;
          font-weight: 600;
          color: #ffd700;
        }

        .habit-list-stats {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .habit-stat-row {
          background: rgba(255, 255, 255, 0.05);
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .habit-stat-row .habit-name {
          display: block;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }

        .habit-stat-bars {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.75rem;
        }

        .stat-mini {
          background: rgba(255, 255, 255, 0.05);
          padding: 0.5rem;
          border-radius: 8px;
          font-size: 0.85rem;
        }

        .level-up-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: levelUpFade 4s;
        }

        @keyframes levelUpFade {
          0%, 70% { opacity: 1; }
          100% { opacity: 0; }
        }

        .level-up-content {
          text-align: center;
          animation: levelUpScale 0.5s;
        }

        @keyframes levelUpScale {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }

        .level-up-icon {
          width: 100px;
          height: 100px;
          color: #ffd700;
          margin-bottom: 1rem;
          filter: drop-shadow(0 0 30px #ffd700);
        }

        .level-up-content h1 {
          font-size: 4rem;
          font-weight: 900;
          background: linear-gradient(135deg, #ffd700, #ff6b6b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1rem;
        }

        .level-display {
          font-size: 3rem;
          font-weight: 700;
          color: #ffd700;
          margin-bottom: 0.5rem;
        }

        .title-unlock {
          font-size: 1.5rem;
          color: #fff;
          margin-bottom: 1rem;
        }

        .sparkles {
          font-size: 2rem;
          animation: sparkle 1s infinite;
        }

        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        .achievement-unlock {
          position: fixed;
          top: 100px;
          right: 2rem;
          background: linear-gradient(135deg, rgba(30, 30, 30, 0.98), rgba(50, 50, 50, 0.98));
          border: 2px solid #ffd700;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 8px 30px rgba(255, 215, 0, 0.4);
          z-index: 1500;
          animation: achievementSlide 0.5s, achievementFade 4s;
        }

        @keyframes achievementSlide {
          from { transform: translateX(400px); }
          to { transform: translateX(0); }
        }

        @keyframes achievementFade {
          0%, 80% { opacity: 1; }
          100% { opacity: 0; }
        }

        .achievement-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .achievement-icon {
          width: 50px;
          height: 50px;
          color: #ffd700;
        }

        .achievement-content h3 {
          margin-bottom: 0.25rem;
          font-size: 1rem;
        }

        .achievement-content p {
          font-weight: 700;
          color: #ffd700;
          margin-bottom: 0.25rem;
        }

        .achievement-content small {
          font-size: 0.85rem;
          opacity: 0.8;
        }

        .notification {
          position: fixed;
          top: 100px;
          right: 2rem;
          background: rgba(30, 30, 30, 0.95);
          border-radius: 12px;
          padding: 1rem 1.5rem;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
          z-index: 1500;
          animation: slideInRight 0.3s, slideOutRight 0.3s 2.7s;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .notification.success {
          border-left: 4px solid #4facfe;
        }

        .notification.warning {
          border-left: 4px solid #ffa502;
        }

        .notification.error {
          border-left: 4px solid #ff4757;
        }

        .notification.info {
          border-left: 4px solid #5f27cd;
        }

        @keyframes slideInRight {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(400px); opacity: 0; }
        }

        @media (max-width: 1200px) {
          .main-container {
            grid-template-columns: 1fr;
          }

          .sidebar {
            position: relative;
            top: 0;
          }

          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .app-header {
            padding: 1rem;
          }

          .header-content h1 {
            font-size: 1.5rem;
          }

          .main-container {
            padding: 1rem;
            gap: 1rem;
          }

          .sidebar {
            padding: 1.5rem;
          }

          .content {
            padding: 1.5rem;
          }

          .avatar-large {
            width: 60px;
            height: 60px;
            font-size: 3rem;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .view-nav {
            flex-wrap: wrap;
          }

          .view-nav button {
            padding: 0.75rem 1rem;
            font-size: 0.9rem;
          }

          .controls-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .filter-group {
            width: 100%;
          }

          .filter-select {
            flex: 1;
          }

          .stats-cards {
            grid-template-columns: 1fr;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .stat-toggles {
            grid-template-columns: repeat(2, 1fr);
          }

          .mini-calendar {
            grid-template-columns: repeat(6, 1fr);
          }

          .category-bar-item {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .habit-stat-bars {
            grid-template-columns: 1fr;
          }

          .notification,
          .achievement-unlock {
            right: 1rem;
            left: 1rem;
          }

          .level-up-content h1 {
            font-size: 2.5rem;
          }

          .level-display {
            font-size: 2rem;
          }

          .quick-stats {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .habit-main {
            flex-direction: column;
            gap: 1rem;
          }

          .habit-actions {
            width: 100%;
            justify-content: flex-end;
          }

          .expanded-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}