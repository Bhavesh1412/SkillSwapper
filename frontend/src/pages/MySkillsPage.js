import React, { useEffect, useMemo, useState } from "react";
import { userAPI } from "../services/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { Plus, Trash2, Check, ChevronDown, ChevronUp } from "lucide-react";

const levelToPercent = (level) => {
  switch ((level || "intermediate").toLowerCase()) {
    case "beginner":
      return 25;
    case "intermediate":
      return 50;
    case "advanced":
      return 75;
    case "expert":
      return 95;
    default:
      return 50;
  }
};

const urgencyToPercent = (urgency) => {
  switch ((urgency || "medium").toLowerCase()) {
    case "low":
      return 30;
    case "medium":
      return 60;
    case "high":
      return 90;
    default:
      return 60;
  }
};

const CircularProgress = ({ percent, colorFrom, colorTo, label }) => {
  const radius = 28;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative w-20 h-20">
      <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
        <defs>
          <linearGradient id={`grad-${colorFrom}-${colorTo}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorFrom} />
            <stop offset="100%" stopColor={colorTo} />
          </linearGradient>
        </defs>
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={`url(#grad-${colorFrom}-${colorTo})`}
          fill="transparent"
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset, transition: "stroke-dashoffset 800ms ease" }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold text-gray-800">{Math.round(percent)}%</span>
      </div>
      {label && <div className="mt-2 text-xs text-center text-gray-500">{label}</div>}
    </div>
  );
};

const SkillCard = ({ name, progress, label, gradient = "from-indigo-500/10 to-purple-500/10" }) => (
  <div className={`group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br ${gradient} p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}> 
    <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-white/30 blur-3xl group-hover:scale-110 transition-transform" />
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-900 tracking-tight">{name}</h3>
      <div className="shrink-0">
        <CircularProgress percent={progress} colorFrom="#6366f1" colorTo="#a855f7" label={label} />
      </div>
    </div>
  </div>
);

// Local storage helpers keyed by user and skill
const storageKey = (userId, skillId) => `myskills_objectives_${userId}_${skillId}`;

const loadObjectives = (userId, skillId) => {
  try {
    const raw = localStorage.getItem(storageKey(userId, skillId));
    if (!raw) return { notes: "", todos: [] };
    const data = JSON.parse(raw);
    return { notes: data.notes || "", todos: Array.isArray(data.todos) ? data.todos : [] };
  } catch (_) {
    return { notes: "", todos: [] };
  }
};

const saveObjectives = (userId, skillId, data) => {
  localStorage.setItem(storageKey(userId, skillId), JSON.stringify(data));
};

const SkillObjectives = ({ userId, skill, variant }) => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    const { notes: n, todos: t } = loadObjectives(userId, skill.id);
    setNotes(n);
    setTodos(t);
  }, [userId, skill.id]);

  const persist = (next) => {
    saveObjectives(userId, skill.id, next);
  };

  const addTodo = () => {
    const text = newTodo.trim();
    if (!text) return;
    const next = { notes, todos: [...todos, { id: Date.now(), text, done: false }] };
    setTodos(next.todos);
    setNewTodo("");
    persist(next);
  };

  const toggleTodo = (id) => {
    const nextTodos = todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    setTodos(nextTodos);
    persist({ notes, todos: nextTodos });
  };

  const removeTodo = (id) => {
    const nextTodos = todos.filter((t) => t.id !== id);
    setTodos(nextTodos);
    persist({ notes, todos: nextTodos });
  };

  const onNotesChange = (e) => {
    const next = e.target.value;
    setNotes(next);
    persist({ notes: next, todos });
  };

  const headerColor = variant === "teach" ? "text-indigo-700" : "text-emerald-700";
  const borderColor = variant === "teach" ? "border-indigo-200" : "border-emerald-200";

  return (
    <div className={`mt-4 rounded-xl border bg-white/70 backdrop-blur ${borderColor}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <span className={`text-sm font-medium ${headerColor}`}>My objectives</span>
        {open ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
      </button>
      {open && (
        <div className="px-4 pb-4">
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={onNotesChange}
              placeholder={variant === "teach" ? "What do I plan to teach or improve?" : "What do I want to learn next?"}
              className="w-full rounded-lg border border-gray-200 bg-white/80 p-2 text-sm outline-none focus:ring-2 focus:ring-primary-300"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Todo</label>
            <div className="flex gap-2 mb-2">
              <input
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Add a task..."
                className="flex-1 rounded-lg border border-gray-200 bg-white/80 p-2 text-sm outline-none focus:ring-2 focus:ring-primary-300"
              />
              <button
                onClick={addTodo}
                className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-2 text-xs font-medium text-white hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
            <ul className="space-y-2">
              {todos.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white/70 px-3 py-2">
                  <button
                    onClick={() => toggleTodo(t.id)}
                    className={`inline-flex items-center gap-2 text-sm ${t.done ? "text-emerald-600" : "text-gray-800"}`}
                  >
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${t.done ? "bg-emerald-100 border-emerald-300" : "bg-white border-gray-300"}`}
                    >
                      {t.done && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className={t.done ? "line-through" : ""}>{t.text}</span>
                  </button>
                  <button onClick={() => removeTodo(t.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
              {todos.length === 0 && (
                <li className="text-xs text-gray-500">No tasks yet.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

const MySkillsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [me, setMe] = useState(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await userAPI.getMe();
        if (isMounted) setMe(res.data.user);
      } catch (e) {
        setError("Failed to load your skills.");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const haveSkills = useMemo(() => me?.skills_have || [], [me]);
  const wantSkills = useMemo(() => me?.skills_want || [], [me]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-10 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">My Skills</h1>
          <p className="text-gray-600 mt-2">What I can teach and what I want to learn.</p>
        </div>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Skills I Can Teach</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {haveSkills.length === 0 && (
              <div className="col-span-full text-gray-500">No skills added yet.</div>
            )}
            {haveSkills.map((s) => (
              <div key={s.id} className="rounded-2xl">
                <SkillCard
                  name={s.skill_name}
                  progress={levelToPercent(s.proficiency_level)}
                  label={s.proficiency_level}
                  gradient="from-indigo-500/15 to-purple-500/15"
                />
                <SkillObjectives userId={me.id} skill={s} variant="teach" />
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Skills I Want To Learn</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wantSkills.length === 0 && (
              <div className="col-span-full text-gray-500">No learning goals yet.</div>
            )}
            {wantSkills.map((s) => (
              <div key={s.id} className="rounded-2xl">
                <SkillCard
                  name={s.skill_name}
                  progress={urgencyToPercent(s.urgency_level)}
                  label={s.urgency_level}
                  gradient="from-emerald-400/10 to-cyan-400/10"
                />
                <SkillObjectives userId={me.id} skill={s} variant="learn" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MySkillsPage;
