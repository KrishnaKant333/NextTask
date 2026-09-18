import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Clock,
  BarChart2,
  Flame,
  ChevronLeft
} from "lucide-react";
import {
  POMODORO_MODES,
  DEFAULT_DURATIONS,
  MODE_META,
  formatTimerSeconds,
  formatFocusMinutes,
  calculateRemainingFromTarget,
  getNextMode,
  playPomodoroChime,
  loadPomodoroState,
  savePomodoroState
} from "../utils/pomodoroUtils";

function PomodoroTimer({
  onToast,
  activeTask = null,
  onUnbindTask,
  onCompletePomodoroForTask,
  forceOpenSignal = 0,
  focusMetrics = null,
  onLogFocusSession = null,
  onRefreshFocusMetrics = null
}) {
  // Load persisted initial state or initialize defaults
  const [timerState, setTimerState] = useState(() => {
    const saved = loadPomodoroState();
    if (!saved) {
      return {
        mode: POMODORO_MODES.WORK,
        isRunning: false,
        remainingSeconds: DEFAULT_DURATIONS[POMODORO_MODES.WORK],
        targetEndTime: null,
        sessionsCompleted: 0,
        soundEnabled: true
      };
    }

    // Reconcile remaining time if it was running when saved
    let remaining = saved.remainingSeconds;
    let isRunning = saved.isRunning;
    let targetEnd = saved.targetEndTime;

    if (isRunning && targetEnd) {
      const calculated = calculateRemainingFromTarget(targetEnd);
      if (calculated <= 0) {
        // Completed while away
        remaining = DEFAULT_DURATIONS[saved.mode];
        isRunning = false;
        targetEnd = null;
      } else {
        remaining = calculated;
      }
    }

    return {
      mode: saved.mode || POMODORO_MODES.WORK,
      isRunning,
      remainingSeconds: typeof remaining === "number" ? remaining : DEFAULT_DURATIONS[POMODORO_MODES.WORK],
      targetEndTime: targetEnd,
      sessionsCompleted: saved.sessionsCompleted || 0,
      soundEnabled: saved.soundEnabled !== false
    };
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("timer"); // "timer" | "stats"
  const containerRef = useRef(null);
  const lastHandledZeroRef = useRef(0);
  const activeTaskRef = useRef(activeTask);
  activeTaskRef.current = activeTask;
  const onCompletePomodoroForTaskRef = useRef(onCompletePomodoroForTask);
  onCompletePomodoroForTaskRef.current = onCompletePomodoroForTask;
  const onLogFocusSessionRef = useRef(onLogFocusSession);
  onLogFocusSessionRef.current = onLogFocusSession;

  // React to programmatic open and start
  useEffect(() => {
    if (forceOpenSignal > 0) {
      setIsExpanded(true);
      setTimerState((prev) => {
        if (prev.isRunning) return prev;
        const secs = prev.mode === POMODORO_MODES.WORK && prev.remainingSeconds > 0
          ? prev.remainingSeconds
          : DEFAULT_DURATIONS[POMODORO_MODES.WORK];
        const targetEnd = Date.now() + secs * 1000;
        return {
          ...prev,
          mode: POMODORO_MODES.WORK,
          isRunning: true,
          targetEndTime: targetEnd,
          remainingSeconds: secs
        };
      });
    }
  }, [forceOpenSignal]);

  const {
    mode,
    isRunning,
    remainingSeconds,
    targetEndTime,
    sessionsCompleted,
    soundEnabled
  } = timerState;

  // Keep state synchronized with localStorage
  useEffect(() => {
    savePomodoroState(timerState);
  }, [timerState]);

  // Click outside to dismiss popover
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target)
      ) {
        setIsExpanded(false);
      }
    }
    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);

  // Synchronize browser tab title
  useEffect(() => {
    const modeLabel = MODE_META[mode]?.label || "Focus";
    if (isRunning) {
      document.title = `(${formatTimerSeconds(remainingSeconds)}) ${modeLabel} • NextTask`;
    } else if (remainingSeconds < DEFAULT_DURATIONS[mode]) {
      document.title = `[Paused] ${formatTimerSeconds(remainingSeconds)} • NextTask`;
    } else {
      document.title = "NextTask";
    }

    return () => {
      document.title = "NextTask";
    };
  }, [isRunning, remainingSeconds, mode]);

  // Core countdown & timestamp reconciliation effect
  useEffect(() => {
    if (!isRunning || !targetEndTime) return;

    function tick() {
      const now = Date.now();
      const diffSecs = calculateRemainingFromTarget(targetEndTime);

      if (diffSecs <= 0) {
        // Prevent duplicate execution within 2 seconds
        if (now - lastHandledZeroRef.current < 2000) return;
        lastHandledZeroRef.current = now;

        // Trigger chime
        if (soundEnabled) {
          playPomodoroChime(
            mode === POMODORO_MODES.WORK ? "work_complete" : "break_complete"
          );
        }

        // Mode transition calculation
        if (mode === POMODORO_MODES.WORK) {
          const nextSessions = sessionsCompleted + 1;
          const nextMode = getNextMode(mode, sessionsCompleted);
          const nextDuration = DEFAULT_DURATIONS[nextMode];

          if (activeTaskRef.current) {
            onCompletePomodoroForTaskRef.current?.(activeTaskRef.current._id);
          }

          onLogFocusSessionRef.current?.({
            taskId: activeTaskRef.current?._id || null,
            projectId: activeTaskRef.current?.projectId?._id || activeTaskRef.current?.projectId || null,
            durationMinutes: 25,
            mode: "work"
          });

          setTimerState((prev) => ({
            ...prev,
            isRunning: false,
            targetEndTime: null,
            mode: nextMode,
            remainingSeconds: nextDuration,
            sessionsCompleted: nextSessions
          }));

          onToast?.(
            nextMode === POMODORO_MODES.LONG_BREAK
              ? "4 focus sessions complete! Take a relaxing 15m Long Break."
              : "Focus session complete! Time for a 5m Short Break.",
            "success"
          );
        } else {
          // Break finished -> Transition to Work
          const nextDuration = DEFAULT_DURATIONS[POMODORO_MODES.WORK];
          setTimerState((prev) => ({
            ...prev,
            isRunning: false,
            targetEndTime: null,
            mode: POMODORO_MODES.WORK,
            remainingSeconds: nextDuration
          }));

          onToast?.("Break ended. Ready for your next focus session.", "info");
        }
      } else {
        setTimerState((prev) => {
          if (!prev.isRunning) return prev;
          return { ...prev, remainingSeconds: diffSecs };
        });
      }
    }

    // Run tick immediately and set 250ms interval for sub-second precision
    tick();
    const intervalId = setInterval(tick, 250);

    // Handle tab focus / visibilitychange to prevent drift
    function handleVisibilityChange() {
      if (!document.hidden && isRunning && targetEndTime) {
        tick();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [isRunning, targetEndTime, mode, sessionsCompleted, soundEnabled, onToast]);

  // Controls: Play / Pause
  function togglePlayPause() {
    if (isRunning) {
      // Pause
      const currentSecs = targetEndTime
        ? calculateRemainingFromTarget(targetEndTime)
        : remainingSeconds;
      setTimerState((prev) => ({
        ...prev,
        isRunning: false,
        targetEndTime: null,
        remainingSeconds: currentSecs
      }));
    } else {
      // Start / Resume
      const secs = remainingSeconds > 0 ? remainingSeconds : DEFAULT_DURATIONS[mode];
      const targetEnd = Date.now() + secs * 1000;
      setTimerState((prev) => ({
        ...prev,
        isRunning: true,
        targetEndTime: targetEnd,
        remainingSeconds: secs
      }));
    }
  }

  // Controls: Reset current mode
  function handleReset() {
    setTimerState((prev) => ({
      ...prev,
      isRunning: false,
      targetEndTime: null,
      remainingSeconds: DEFAULT_DURATIONS[prev.mode]
    }));
  }

  // Controls: Skip to next mode
  function handleSkip() {
    const nextMode = getNextMode(mode, sessionsCompleted);
    setTimerState((prev) => ({
      ...prev,
      isRunning: false,
      targetEndTime: null,
      mode: nextMode,
      remainingSeconds: DEFAULT_DURATIONS[nextMode]
    }));
  }

  // Controls: Switch mode manually
  function handleSwitchMode(targetMode) {
    if (targetMode === mode) return;
    setTimerState((prev) => ({
      ...prev,
      isRunning: false,
      targetEndTime: null,
      mode: targetMode,
      remainingSeconds: DEFAULT_DURATIONS[targetMode]
    }));
  }

  // Toggle audio
  function toggleSound() {
    setTimerState((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled
    }));
  }

  const currentMeta = MODE_META[mode] || MODE_META[POMODORO_MODES.WORK];
  const totalModeDuration = DEFAULT_DURATIONS[mode];
  const progressPercent = Math.min(
    100,
    Math.max(
      0,
      Math.round(((totalModeDuration - remainingSeconds) / totalModeDuration) * 100)
    )
  );

  return (
    <div className="pomodoro-widget-root" ref={containerRef}>
      {/* 1. Docked Header Pill */}
      <div
        className={`pomodoro-dock-pill ${isRunning ? "is-running" : ""} ${
          currentMeta.dotClass
        } ${activeTask ? "has-bound-task" : ""}`}
        onClick={() => setIsExpanded((prev) => !prev)}
        role="region"
        aria-label="Pomodoro Focus Timer"
      >
        <span
          className="pomodoro-dock-dot"
          style={{ backgroundColor: currentMeta.accent }}
        />
        <span className="pomodoro-dock-time font-tabular">
          {formatTimerSeconds(remainingSeconds)}
        </span>
        {activeTask && (
          <span className="pomodoro-dock-task" title={`Focusing on: ${activeTask.title}`}>
            <span className="dock-task-separator">•</span>
            <span className="dock-task-name">{activeTask.title}</span>
          </span>
        )}
        <button
          type="button"
          className="pomodoro-dock-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            togglePlayPause();
          }}
          title={isRunning ? "Pause focus timer" : "Start focus timer"}
          aria-label={isRunning ? "Pause focus timer" : "Start focus timer"}
        >
          {isRunning ? (
            <Pause size={11} strokeWidth={2.5} />
          ) : (
            <Play size={11} strokeWidth={2.5} className="play-icon-offset" />
          )}
        </button>
      </div>

      {/* 2. Expanded Focus Control Popover */}
      {isExpanded && (
        <div
          className="pomodoro-popover-card"
          role="dialog"
          aria-label="Pomodoro Timer Controls"
        >
          {/* Card Header */}
          <div className="pomodoro-popover-header">
            <div className="popover-title-row">
              <Clock size={15} strokeWidth={2} className="popover-clock-icon" />
              <span className="popover-title">Pomodoro Timer</span>
            </div>
            <div className="popover-header-actions">
              <button
                type="button"
                className={`popover-icon-btn ${activeTab === "stats" ? "active" : ""}`}
                onClick={() => {
                  if (activeTab === "timer") {
                    setActiveTab("stats");
                    onRefreshFocusMetrics?.();
                  } else {
                    setActiveTab("timer");
                  }
                }}
                title={activeTab === "timer" ? "View Today's Focus Metrics" : "Return to Focus Timer"}
                aria-label={activeTab === "timer" ? "View Today's Focus Metrics" : "Return to Focus Timer"}
              >
                {activeTab === "timer" ? (
                  <BarChart2 size={14} strokeWidth={2} />
                ) : (
                  <Clock size={14} strokeWidth={2} />
                )}
              </button>
              <button
                type="button"
                className={`popover-icon-btn ${!soundEnabled ? "is-muted" : ""}`}
                onClick={toggleSound}
                title={soundEnabled ? "Mute sound chime" : "Enable sound chime"}
                aria-label={soundEnabled ? "Mute sound chime" : "Enable sound chime"}
              >
                {soundEnabled ? (
                  <Volume2 size={14} strokeWidth={2} />
                ) : (
                  <VolumeX size={14} strokeWidth={2} />
                )}
              </button>
              <button
                type="button"
                className="popover-icon-btn"
                onClick={() => setIsExpanded(false)}
                title="Close controls"
                aria-label="Close controls"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>
          </div>

          {activeTab === "stats" ? (
            /* Focus Analytics & Metrics View */
            <div className="pomodoro-stats-view">
              {/* 3-Card KPI Grid */}
              <div className="focus-kpi-grid">
                <div className="focus-kpi-card">
                  <span className="kpi-label">Today's Focus</span>
                  <span className="kpi-value font-tabular">
                    {formatFocusMinutes(focusMetrics?.totalFocusMinutesToday || 0)}
                  </span>
                </div>
                <div className="focus-kpi-card">
                  <span className="kpi-label">Sessions</span>
                  <span className="kpi-value font-tabular">
                    {focusMetrics?.sessionsCompletedToday || 0}
                  </span>
                </div>
                <div className="focus-kpi-card">
                  <span className="kpi-label">Streak</span>
                  <span className="kpi-value font-tabular streak-val">
                    <Flame size={12} strokeWidth={2.5} className="streak-flame-icon" />
                    {focusMetrics?.dailyStreak || 0}d
                  </span>
                </div>
              </div>

              {/* Project Focus Distribution */}
              <div className="focus-section-wrap">
                <div className="focus-section-header">
                  <span className="focus-section-title">Project Distribution</span>
                </div>
                {Array.isArray(focusMetrics?.projectDistribution) && focusMetrics.projectDistribution.length > 0 ? (
                  <div className="focus-distribution-list">
                    {focusMetrics.projectDistribution.map((proj) => {
                      const totalMins = focusMetrics.totalFocusMinutesToday || 1;
                      const percent = Math.min(100, Math.round((proj.minutes / totalMins) * 100));
                      return (
                        <div key={proj.projectId} className="focus-distribution-item">
                          <div className="distribution-item-header">
                            <span className="distribution-proj-name">
                              <span
                                className="project-dot"
                                style={{ backgroundColor: proj.color || "#6366f1" }}
                              />
                              {proj.name}
                            </span>
                            <span className="distribution-time font-tabular">
                              {formatFocusMinutes(proj.minutes)}
                            </span>
                          </div>
                          <div className="distribution-bar-track">
                            <div
                              className="distribution-bar-fill"
                              style={{
                                width: `${percent}%`,
                                backgroundColor: proj.color || "#6366f1"
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="focus-empty-notice">
                    No focus sessions logged today yet.
                  </div>
                )}
              </div>

              {/* Today's Recent Sessions Activity */}
              {Array.isArray(focusMetrics?.recentSessions) && focusMetrics.recentSessions.length > 0 && (
                <div className="focus-section-wrap">
                  <div className="focus-section-header">
                    <span className="focus-section-title">Today's Sessions</span>
                  </div>
                  <div className="focus-recent-list">
                    {focusMetrics.recentSessions.map((s) => {
                      const d = new Date(s.completedAt);
                      const timeStr = !isNaN(d.getTime())
                        ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                        : "";
                      return (
                        <div key={s._id} className="focus-recent-item">
                          <span className="recent-item-task" title={s.taskId?.title || "General Focus"}>
                            {s.taskId?.title || "General Focus Session"}
                          </span>
                          <span className="recent-item-meta font-tabular">
                            {timeStr}
                            <span className="recent-duration-pill">
                              {s.durationMinutes}m
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Return to Timer */}
              <button
                type="button"
                className="focus-back-btn"
                onClick={() => setActiveTab("timer")}
              >
                <ChevronLeft size={13} strokeWidth={2} />
                <span>Back to Timer</span>
              </button>
            </div>
          ) : (
            /* Timer View */
            <>
              {/* Active Bound Task Banner */}
              {activeTask && (
                <div className="pomodoro-bound-task-banner">
                  <div className="bound-task-meta">
                    <span className="bound-task-caption">Current Task</span>
                    <span className="bound-task-title" title={activeTask.title}>
                      {activeTask.title}
                    </span>
                    <div className="bound-task-tags">
                      {activeTask.projectId && (
                        <span className="bound-task-project">
                          <span
                            className="project-dot"
                            style={{
                              backgroundColor: activeTask.projectId.color || "#6366f1"
                            }}
                          />
                          {activeTask.projectId.name}
                        </span>
                      )}
                      <span className="bound-task-pomodoros font-tabular">
                        {activeTask.pomodorosCompleted || 0}/{activeTask.estimatedPomodoros || 1} Pomodoros
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="bound-task-unbind-btn"
                    onClick={onUnbindTask}
                    title="Unbind task from focus timer"
                    aria-label="Unbind task"
                  >
                    <X size={13} strokeWidth={2} />
                  </button>
                </div>
              )}

          {/* Mode Selector Tabs */}
          <div className="pomodoro-mode-switch" role="tablist">
            {Object.values(POMODORO_MODES).map((m) => {
              const meta = MODE_META[m];
              const active = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`pomodoro-mode-tab ${active ? "active" : ""}`}
                  onClick={() => handleSwitchMode(m)}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>

          {/* Focal Countdown & Progress Bar */}
          <div className="pomodoro-focal-display">
            <div className="pomodoro-focal-time font-tabular">
              {formatTimerSeconds(remainingSeconds)}
            </div>
            <div className="pomodoro-progress-track">
              <div
                className="pomodoro-progress-fill"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: currentMeta.accent
                }}
              />
            </div>

            {/* Cycle Progress Dots */}
            <div className="pomodoro-cycles-wrap">
              <span className="pomodoro-cycle-label">
                Session {((sessionsCompleted) % 4) + 1} of 4
              </span>
              <div className="pomodoro-cycle-dots">
                {[0, 1, 2, 3].map((dotIdx) => {
                  const currentCyclePos = sessionsCompleted % 4;
                  const isCompletedDot = dotIdx < currentCyclePos;
                  const isCurrentDot = dotIdx === currentCyclePos && mode === POMODORO_MODES.WORK;
                  return (
                    <span
                      key={dotIdx}
                      className={`cycle-dot ${isCompletedDot ? "completed" : ""} ${
                        isCurrentDot ? "current" : ""
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="pomodoro-controls-row">
            <button
              type="button"
              className="pomodoro-secondary-btn"
              onClick={handleReset}
              title="Reset current interval"
              aria-label="Reset interval"
            >
              <RotateCcw size={14} strokeWidth={2} />
              <span>Reset</span>
            </button>

            <button
              type="button"
              className={`pomodoro-primary-btn ${isRunning ? "is-running" : ""}`}
              onClick={togglePlayPause}
              title={isRunning ? "Pause" : "Start"}
              aria-label={isRunning ? "Pause" : "Start"}
            >
              {isRunning ? (
                <>
                  <Pause size={15} strokeWidth={2.5} />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play size={15} strokeWidth={2.5} className="play-icon-offset" />
                  <span>Start</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="pomodoro-secondary-btn"
              onClick={handleSkip}
              title="Skip to next interval"
              aria-label="Skip to next interval"
            >
              <span>Skip</span>
              <SkipForward size={14} strokeWidth={2} />
            </button>
          </div>
        </>
      )}
    </div>
  )}
</div>
);
}

export default PomodoroTimer;
