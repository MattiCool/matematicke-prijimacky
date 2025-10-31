import React, { useState, useContext, createContext, useEffect } from "react";
import {
  loginUser,
  logoutUser,
  registerUser,
  onAuthStateChange,
} from "./lib/authService";
import { getProblemsByTopic, getAllProblems } from "./lib/problemsService";

// Mock Data - s podporou obrázků (můžete smazat po přechodu na DB)
const mockProblems = [
  {
    id: 1,
    topic_area_id: 1,
    title: "Výpočet výrazu s odmocninami",
    question_text: "Vypočítejte hodnotu výrazu: √(25) + √(16) - √(9)",
    question_image_url: null,
    difficulty_level: "easy",
    year: 2024,
    problem_number: 1,
    opions: [
      {
        id: 1,
        option_letter: "A",
        answer_text: "4",
        answer_image_url: null,
        is_correct: false,
      },
      {
        id: 2,
        option_letter: "B",
        answer_text: "6",
        answer_image_url: null,
        is_correct: true,
      },
      {
        id: 3,
        option_letter: "C",
        answer_text: "8",
        answer_image_url: null,
        is_correct: false,
      },
      {
        id: 4,
        option_letter: "D",
        answer_text: "10",
        answer_image_url: null,
        is_correct: false,
      },
    ],
  },
  {
    id: 2,
    topic_area_id: 2,
    title: "Lineární funkce",
    question_text: "Určete směrnici přímky procházející body A[2,3] a B[4,7].",
    question_image_url: null,
    difficulty_level: "medium",
    year: 2024,
    problem_number: 2,
    options: [
      {
        id: 5,
        option_letter: "A",
        answer_text: "1",
        answer_image_url: null,
        is_correct: false,
      },
      {
        id: 6,
        option_letter: "B",
        answer_text: "2",
        answer_image_url: null,
        is_correct: true,
      },
      {
        id: 7,
        option_letter: "C",
        answer_text: "3",
        answer_image_url: null,
        is_correct: false,
      },
      {
        id: 8,
        option_letter: "D",
        answer_text: "4",
        answer_image_url: null,
        is_correct: false,
      },
    ],
  },
  {
    id: 3,
    topic_area_id: 3,
    title: "Obsah čtverce",
    question_text: "Čtverec má stranu délky 5 cm. Jaký je jeho obsah?",
    question_image_url: null,
    difficulty_level: "easy",
    year: 2024,
    problem_number: 3,
    options: [
      {
        id: 9,
        option_letter: "A",
        answer_text: "20 cm²",
        answer_image_url: null,
        is_correct: false,
      },
      {
        id: 10,
        option_letter: "B",
        answer_text: "25 cm²",
        answer_image_url: null,
        is_correct: true,
      },
      {
        id: 11,
        option_letter: "C",
        answer_text: "10 cm²",
        answer_image_url: null,
        is_correct: false,
      },
      {
        id: 12,
        option_letter: "D",
        answer_text: "15 cm²",
        answer_image_url: null,
        is_correct: false,
      },
    ],
  },
  {
    id: 4,
    topic_area_id: 4,
    title: "Posloupnost čísel",
    question_text: "Jaké číslo následuje v posloupnosti: 2, 4, 8, 16, ?",
    question_image_url: null,
    difficulty_level: "medium",
    year: 2024,
    problem_number: 4,
    options: [
      {
        id: 13,
        option_letter: "A",
        answer_text: "24",
        answer_image_url: null,
        is_correct: false,
      },
      {
        id: 14,
        option_letter: "B",
        answer_text: "32",
        answer_image_url: null,
        is_correct: true,
      },
      {
        id: 15,
        option_letter: "C",
        answer_text: "30",
        answer_image_url: null,
        is_correct: false,
      },
      {
        id: 16,
        option_letter: "D",
        answer_text: "20",
        answer_image_url: null,
        is_correct: false,
      },
    ],
  },
];

const topicAreas = [
  { id: 1, name: "Číslo a proměnná", code: "numbers", icon: "🔢" },
  { id: 2, name: "Závislosti a vztahy", code: "dependencies", icon: "📊" },
  { id: 3, name: "Geometrie v rovině", code: "geometry", icon: "📐" },
  { id: 4, name: "Nestandardní úlohy", code: "applications", icon: "🧩" },
];

// =====================================================
// IMAGE COMPONENTS
// =====================================================
const ImageViewer = ({ src, alt, onClose }) => {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300"
        >
          ✕
        </button>
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[85vh] object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

const QuestionImage = ({ imageUrl, alt = "Obrázek k zadání" }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  if (!imageUrl) return null;
  return (
    <>
      <div className="mb-6 relative">
        {loading && (
          <div className="animate-pulse bg-gray-200 h-64 w-full rounded-lg"></div>
        )}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
            ⚠️ Obrázek se nepodařilo načíst
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={alt}
            className={`max-w-full h-auto rounded-lg border-2 border-gray-300 cursor-pointer hover:border-blue-400 transition-all ${
              loading ? "hidden" : "block"
            }`}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
            onClick={() => setShowZoom(true)}
            title="Klikněte pro zvětšení"
          />
        )}
        {!loading && !error && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
            🔍 Klikněte pro zvětšení
          </div>
        )}
      </div>
      {showZoom && (
        <ImageViewer
          src={imageUrl}
          alt={alt}
          onClose={() => setShowZoom(false)}
        />
      )}
    </>
  );
};

const AnswerOption = ({ option, selected, onChange }) => {
  const [showZoom, setShowZoom] = useState(false);
  return (
    <>
      <label
        className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
          selected
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <input
          type="radio"
          name="answer"
          value={option.id}
          checked={selected}
          onChange={onChange}
          className="mt-1 mr-4"
        />
        <span className="font-semibold mr-3">{option.option_letter})</span>
        <div className="flex-1 flex items-start gap-3">
          <span className="flex-1">{option.answer_text}</span>
          {option.answer_image_url && (
            <img
              src={option.answer_image_url}
              alt={`Odpověď ${option.option_letter}`}
              className="w-24 h-24 object-contain rounded border border-gray-300 cursor-pointer hover:border-blue-400 transition-all"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowZoom(true);
              }}
              title="Klikněte pro zvětšení"
            />
          )}
        </div>
      </label>
      {showZoom && option.answer_image_url && (
        <ImageViewer
          src={option.answer_image_url}
          alt={`Odpověď ${option.option_letter}`}
          onClose={() => setShowZoom(false)}
        />
      )}
    </>
  );
};

// =====================================================
// CONTEXTS
// =====================================================
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: authListener } = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    const { user, error } = await loginUser(email, password);

    if (error) {
      alert(`Chyba přihlášení: ${error}`);
      setLoading(false);
      return;
    }

    setUser(user);
    setLoading(false);
  };

  const register = async (name, email, password) => {
    setLoading(true);
    const { user, error } = await registerUser(email, password, name);

    if (error) {
      alert(`Chyba registrace: ${error}`);
      setLoading(false);
      return;
    }

    setUser(user);
    setLoading(false);
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const QuizContext = createContext();

const QuizProvider = ({ children }) => {
  const [currentProblem, setCurrentProblem] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [currentQuizMode, setCurrentQuizMode] = useState(null);
  const [currentSessionAnswers, setCurrentSessionAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [quizStats, setQuizStats] = useState({
    totalProblems: 0,
    correctAnswers: 0,
    accuracy: 0,
    averageTime: 0,
    streak: 0,
  });
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ NOVÉ - sledování času
  const [questionStartTime, setQuestionStartTime] = useState(null);

  const loadProblems = async (topicId) => {
    setLoading(true);
    try {
      let loadedProblems;
      if (topicId === "mix") {
        loadedProblems = await getAllProblems();
      } else {
        loadedProblems = await getProblemsByTopic(topicId);
      }
      setProblems(loadedProblems);
      return loadedProblems;
    } catch (error) {
      console.error("❌ Chyba při načítání příkladů:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (topicId = null) => {
    if (topicId === null) {
      setCurrentProblem(null);
      setCurrentQuizMode(null);
      setCurrentSessionAnswers([]);
      setShowResults(false);
      setProblems([]);
      setQuestionStartTime(null); // ✅ Reset času
      return;
    }

    setCurrentSessionAnswers([]);
    setShowResults(false);
    setCurrentQuizMode(topicId);

    const loadedProblems = await loadProblems(topicId);

    if (loadedProblems.length > 0) {
      setCurrentProblem(loadedProblems[0]);
      setQuestionStartTime(Date.now()); // ✅ Začátek měření času
    } else {
      alert("⚠️ Pro tuto oblast nejsou zatím příklady v databázi!");
    }
  };

  const getNextProblem = () => {
    const answeredIds = currentSessionAnswers.map((a) => a.problem_id);
    const unansweredProblems = problems.filter(
      (p) => !answeredIds.includes(p.id)
    );
    return unansweredProblems.length > 0 ? unansweredProblems[0] : null;
  };

  // ✅ UPRAVENÁ funkce submitAnswer - s ukládáním do DB
  const submitAnswer = async (userId, problemId, optionId) => {
    const problem = problems.find((p) => p.id === problemId);
    const option = problem.options.find((o) => o.id === optionId);

    // ✅ Výpočet času stráveného nad otázkou
    const timeSpent = questionStartTime
      ? Math.round((Date.now() - questionStartTime) / 1000)
      : 0;

    const answer = {
      problem_id: problemId,
      selected_option_id: optionId,
      is_correct: option.is_correct,
      answered_at: new Date(),
      problem_title: problem.title,
      time_spent_seconds: timeSpent,
    };

    setCurrentSessionAnswers((prev) => [...prev, answer]);
    setUserAnswers((prev) => [...prev, answer]);

    // ✅ NOVÉ - Uložení do databáze
    if (userId) {
      const { saveUserAnswer } = await import("./lib/answerService");
      const { error } = await saveUserAnswer(
        userId,
        problemId,
        optionId,
        option.is_correct,
        timeSpent
      );

      if (error) {
        console.error("⚠️ Nepodařilo se uložit odpověď do databáze:", error);
      }
    }

    return answer;
  };

  // ✅ NOVÁ funkce pro nastavení další otázky
  const moveToNextProblem = () => {
    const nextProblem = getNextProblem();
    if (nextProblem) {
      setCurrentProblem(nextProblem);
      setQuestionStartTime(Date.now()); // ✅ Restart času pro novou otázku
    }
    return nextProblem;
  };

  // ✅ NOVÁ funkce pro načtení statistik
  const loadUserStats = async (userId) => {
    if (!userId) return;

    try {
      const { getUserOverallStats } = await import("./lib/answerService");
      const { data, error } = await getUserOverallStats(userId);

      if (error) {
        console.error("❌ Chyba při načítání statistik:", error);
        return;
      }

      if (data) {
        setQuizStats(data);
      }
    } catch (error) {
      console.error("❌ Chyba při načítání statistik:", error);
    }
  };

  const finishQuiz = () => {
    setShowResults(true);
    setCurrentProblem(null);
    setQuestionStartTime(null); // ✅ Reset času
  };

  const getQuizResults = () => {
    const correctCount = currentSessionAnswers.filter(
      (a) => a.is_correct
    ).length;
    const totalCount = currentSessionAnswers.length;
    const percentage =
      totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    return {
      correct: correctCount,
      total: totalCount,
      percentage,
      answers: currentSessionAnswers,
    };
  };

  return (
    <QuizContext.Provider
      value={{
        currentProblem,
        userAnswers,
        quizStats,
        currentQuizMode,
        currentSessionAnswers,
        showResults,
        loading,
        startQuiz,
        submitAnswer,
        getNextProblem,
        moveToNextProblem, // ✅ NOVÉ
        finishQuiz,
        getQuizResults,
        setCurrentProblem,
        setShowResults,
        loadUserStats, // ✅ NOVÉ
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);
const useQuiz = () => useContext(QuizContext);

// =====================================================
// SHARED COMPONENTS
// =====================================================
const Button = ({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled,
  className = "",
}) => {
  const baseClasses =
    "font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
    outline:
      "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${
        variantClasses[variant]
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = "", padding = "p-6", onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-xl shadow-sm border border-gray-200 ${padding} ${className} ${
      onClick ? "cursor-pointer" : ""
    }`}
  >
    {children}
  </div>
);

const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const Sidebar = ({
  activeItem = "dashboard",
  onNavigate,
  isInQuiz = false,
  onExitRequest,
}) => {
  const { user, logout } = useAuth();
  const menuItems = [
    { key: "dashboard", icon: "📊", label: "Hlavní strana" },
    { key: "quiz", icon: "🎯", label: "Testování" },
    { key: "statistics", icon: "📚", label: "Statistiky" },
    { key: "profile", icon: "👤", label: "Profil" },
  ];

  const handleNavigation = (key) => {
    // Pokud je uživatel v testu a chce jít jinam než na quiz, zobrazte potvrzení
    if (isInQuiz && activeItem === "quiz" && key !== "quiz") {
      if (onExitRequest) {
        onExitRequest();
      }
    } else {
      onNavigate(key);
    }
  };

  const handleLogout = () => {
    // Pokud je uživatel v testu, zobrazte potvrzení
    if (isInQuiz && activeItem === "quiz") {
      if (onExitRequest) {
        onExitRequest();
      }
    } else {
      logout();
    }
  };

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 fixed left-0 top-0">
      <div className="p-6 border-b border-gray-200">
        <div className="text-xl font-bold text-blue-600">📊 MathForFun</div>
      </div>
      {user && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
              {user.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <div className="font-semibold text-sm">{user.email}</div>
              <div className="text-xs text-gray-500">Testovací účet</div>
            </div>
          </div>
        </div>
      )}
      <nav className="p-4">
        {menuItems.map((item) => (
          <div
            key={item.key}
            onClick={() => handleNavigation(item.key)}
            className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
              activeItem === item.key
                ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </div>
        ))}
      </nav>
      <div className="absolute bottom-4 left-4 right-4">
        <Button variant="outline" onClick={handleLogout} className="w-full">
          Odhlásit se
        </Button>
      </div>
    </div>
  );
};

// =====================================================
// PAGES
// =====================================================
const LandingPage = () => {
  const { login, register, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activeTab === "login") {
      await login(formData.email, formData.password);
    } else {
      await register(formData.name, formData.email, formData.password);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="text-2xl font-bold text-blue-600">
            📊 Matematické přijímačky
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Připravte se na přijímačky z matematiky
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Procvičujte si příklady z minulých let, získejte okamžitou zpětnou
              vazbu a sledujte svůj pokrok.
            </p>
          </div>
          <Card>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Testovací přihlášení:</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Pro otestování aplikace použijte vygenerované přihlašovací
                údaje.
              </p>
            </div>
            <div className="flex mb-6 border-b">
              {["login", "register"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 px-4 font-medium ${
                    activeTab === tab
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  {tab === "login" ? "Přihlášení" : "Registrace"}
                </button>
              ))}
            </div>
            {/* ✅ NOVÁ ZPRÁVA PRO REGISTRACI */}
            {activeTab === "register" && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-semibold">
                  ⚠️ Registrace není bohužel v této fázi projektu možná
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Pro testování použijte vygenerované přihlašovací údaje.
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === "register" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Celé jméno
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Jan Novák"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="test@test.cz"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heslo
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Vaše heslo"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading
                  ? "Načítám..."
                  : activeTab === "login"
                  ? "Přihlásit se"
                  : "Zaregistrovat se"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, change, icon }) => (
  <Card className="flex items-center space-x-4">
    <div className="text-4xl">{icon}</div>
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-500">{title}</div>
      {change && (
        <div
          className={`text-xs font-semibold ${
            change.startsWith("+") ? "text-green-600" : "text-red-600"
          }`}
        >
          {change}
        </div>
      )}
    </div>
  </Card>
);

const DashboardPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const { startQuiz } = useQuiz();
  const [stats, setStats] = useState({
    totalProblems: 0,
    correctAnswers: 0,
    accuracy: 0,
    averageTime: 0,
    streak: 0,
    accuracyChange: "+0%",
  });
  const [topicStats, setTopicStats] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Načtení statistik při načtení komponenty
  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) return;

      setLoading(true);

      try {
        // Načtení celkových statistik
        const { getOverallStats, getStatsByAllTopics } = await import(
          "./lib/statsService"
        );

        const { data: overallData, error: overallError } =
          await getOverallStats(user.id);
        if (overallError) {
          console.error(
            "Chyba při načítání celkových statistik:",
            overallError
          );
        } else if (overallData) {
          setStats(overallData);
        }

        // Načtení statistik podle oblastí
        const { data: topicsData, error: topicsError } =
          await getStatsByAllTopics(user.id);
        if (topicsError) {
          console.error(
            "Chyba při načítání statistik podle oblastí:",
            topicsError
          );
        } else if (topicsData) {
          setTopicStats(topicsData);
        }
      } catch (error) {
        console.error("Kritická chyba při načítání statistik:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user]);

  const handleStartQuiz = (topicId) => {
    startQuiz(topicId);
    onNavigate("quiz");
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar activeItem="dashboard" onNavigate={onNavigate} />
        <div className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-20">
              <div className="animate-spin text-6xl mb-4">⏳</div>
              <p className="text-gray-600">Načítám statistiky...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar activeItem="dashboard" onNavigate={onNavigate} />
      <div className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Vítejte zpět!</h1>
            <p className="text-gray-600">
              Podívejte se na svůj pokrok a pokračujte v přípravě.
            </p>
          </div>

          {/* ✅ Statistické karty s reálnými daty */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Celková úspěšnost"
              value={`${stats.accuracy}%`}
              change={stats.accuracyChange}
              icon="📈"
            />
            <StatCard
              title="Celkem příkladů"
              value={stats.totalProblems}
              change={`+${stats.totalProblems} celkem`}
              icon="📝"
            />
            <StatCard
              title="Průměrný čas"
              value={`${stats.averageTime} min`}
              change={stats.totalProblems > 0 ? "na otázku" : ""}
              icon="⏱️"
            />
            <StatCard
              title="Aktuální série"
              value={`${stats.streak} ${
                stats.streak === 1 ? "den" : stats.streak < 5 ? "dny" : "dní"
              }`}
              change={stats.streak > 0 ? "Skvělé!" : "Začněte testovat"}
              icon="🔥"
            />
          </div>

          {/* ✅ Pokud nemá žádné odpovědi, zobrazit uvítací zprávu */}
          {stats.totalProblems === 0 && (
            <Card className="mb-8 bg-blue-50 border-blue-200">
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎯</div>
                <h2 className="text-2xl font-bold mb-2">
                  Začněte svou přípravu!
                </h2>
                <p className="text-gray-600 mb-4">
                  Vyberte jednu z tematických oblastí níže a začněte procvičovat
                  příklady.
                </p>
              </div>
            </Card>
          )}

          {/* ✅ Tematické oblasti s reálnými statistikami */}
          <Card>
            <h2 className="text-xl font-bold mb-4">Tematické oblasti</h2>
            <div className="space-y-4">
              {topicAreas.map((area) => {
                const areaStats = topicStats.find(
                  (s) => s.topic_id === area.id
                );

                return (
                  <div
                    key={area.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <span className="text-3xl">{area.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-lg">
                            {area.name}
                          </span>
                          {areaStats && areaStats.total_problems > 0 && (
                            <span
                              className={`text-sm font-semibold px-2 py-1 rounded ${
                                areaStats.accuracy >= 80
                                  ? "bg-green-100 text-green-700"
                                  : areaStats.accuracy >= 60
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {areaStats.accuracy}% úspěšnost
                            </span>
                          )}
                        </div>
                        {areaStats && areaStats.total_problems > 0 ? (
                          <div className="text-sm text-gray-600 mt-1">
                            {areaStats.correct_answers} správně z{" "}
                            {areaStats.total_problems} pokusů
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 mt-1">
                            Zatím žádné pokusy
                          </div>
                        )}
                      </div>
                    </div>
                    <Button onClick={() => handleStartQuiz(area.id)} size="sm">
                      Testovat
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* ✅ Rychlé statistiky podle oblastí - vizuální přehled */}
          {stats.totalProblems > 0 && (
            <Card className="mt-8">
              <h2 className="text-xl font-bold mb-4">
                Přehled pokroku podle oblastí
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {topicAreas.map((area) => {
                  const areaStats = topicStats.find(
                    (s) => s.topic_id === area.id
                  );
                  const accuracy = areaStats?.accuracy || 0;

                  return (
                    <div
                      key={area.id}
                      className="text-center p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="text-3xl mb-2">{area.icon}</div>
                      <div className="font-medium text-sm mb-2">
                        {area.name}
                      </div>
                      <div className="relative w-full h-2 bg-gray-200 rounded-full mb-2">
                        <div
                          className={`absolute top-0 left-0 h-2 rounded-full ${
                            accuracy >= 80
                              ? "bg-green-500"
                              : accuracy >= 60
                              ? "bg-yellow-500"
                              : accuracy > 0
                              ? "bg-red-500"
                              : "bg-gray-300"
                          }`}
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                      <div className="text-sm font-semibold text-gray-700">
                        {accuracy}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// Komponenta pro výsledky testu
const QuizResults = ({ results, topicArea, onNavigate, onRetry }) => {
  const accuracyColor =
    results.percentage >= 80
      ? "text-green-600"
      : results.percentage >= 60
      ? "text-yellow-600"
      : "text-red-600";

  const accuracyBg =
    results.percentage >= 80
      ? "bg-green-100"
      : results.percentage >= 60
      ? "bg-yellow-100"
      : "bg-red-100";

  const message =
    results.percentage >= 90
      ? { emoji: "🎉", text: "Výborný výsledek!" }
      : results.percentage >= 80
      ? { emoji: "🌟", text: "Skvělá práce!" }
      : results.percentage >= 70
      ? { emoji: "👍", text: "Dobrý výsledek!" }
      : results.percentage >= 60
      ? { emoji: "💪", text: "Můžete se zlepšit!" }
      : { emoji: "📚", text: "Procvičte si látku!" };

  // Výpočet průměrného času
  const totalTime = results.answers.reduce(
    (sum, a) => sum + (a.time_spent_seconds || 0),
    0
  );
  const avgTime =
    results.total > 0 ? (totalTime / results.total / 60).toFixed(1) : 0;

  return (
    <div className="flex">
      <Sidebar activeItem="quiz" onNavigate={onNavigate} isInQuiz={false} />

      <div className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <Card className="text-center p-8">
            {/* Hlavička */}
            <div className="mb-6">
              <div className="text-6xl mb-4">{message.emoji}</div>
              <h1 className="text-3xl font-bold mb-2">Test dokončen!</h1>
              <p className="text-lg text-gray-600">
                {topicArea ? topicArea.name : "Mix test"} - {results.total}{" "}
                otázek
              </p>
            </div>

            {/* Velké procento */}
            <div className={`${accuracyBg} rounded-2xl p-8 mb-6`}>
              <div className={`text-7xl font-bold ${accuracyColor} mb-2`}>
                {results.percentage}%
              </div>
              <div className="text-xl font-semibold text-gray-700">
                {message.text}
              </div>
            </div>

            {/* Statistiky */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-600">
                  {results.correct}
                </div>
                <div className="text-sm text-gray-600">Správně</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-red-600">
                  {results.total - results.correct}
                </div>
                <div className="text-sm text-gray-600">Špatně</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-600">
                  {avgTime}
                </div>
                <div className="text-sm text-gray-600">Průměr (min)</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="relative w-full h-8 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`absolute top-0 left-0 h-8 rounded-full transition-all ${
                    results.percentage >= 80
                      ? "bg-green-500"
                      : results.percentage >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${results.percentage}%` }}
                >
                  <div className="flex items-center justify-center h-full text-white font-semibold">
                    {results.correct}/{results.total}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailní přehled odpovědí */}
            <div className="text-left mb-6">
              <h3 className="text-lg font-semibold mb-3 text-center">
                Přehled odpovědí
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {results.answers.map((answer, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between py-3 px-4 rounded-lg ${
                      answer.is_correct ? "bg-green-50" : "bg-red-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xl ${
                          answer.is_correct ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {answer.is_correct ? "✓" : "✗"}
                      </span>
                      <span className="text-sm font-medium">
                        {index + 1}. {answer.problem_title}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {answer.time_spent_seconds}s
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Akce */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={onRetry}
                size="lg"
                className="flex items-center gap-2"
              >
                <span>🔄</span>
                <span>Zopakovat test</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate("statistics")}
                size="lg"
                className="flex items-center gap-2"
              >
                <span>📊</span>
                <span>Zobrazit statistiky</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate("dashboard")}
                size="lg"
                className="flex items-center gap-2"
              >
                <span>🏠</span>
                <span>Hlavní stránka</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const QuizPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const {
    currentProblem,
    submitAnswer,
    startQuiz,
    moveToNextProblem,
    setCurrentProblem,
    loading,
    currentSessionAnswers,
    loadUserStats,
    currentQuizMode,
    showResults,
    getQuizResults,
    finishQuiz,
  } = useQuiz();

  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [result, setResult] = useState(null);
  const [showAIExplanation, setShowAIExplanation] = useState(false);
  const [aiExplanation, setAiExplanation] = useState("");
  const [explanationAttempt, setExplanationAttempt] = useState(1);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  // ✅ Načtení statistik při načtení komponenty
  useEffect(() => {
    if (user?.id) {
      loadUserStats(user.id);
    }
  }, [user, loadUserStats]);

  // Loading stav
  if (loading) {
    return (
      <div className="flex">
        <Sidebar activeItem="quiz" onNavigate={onNavigate} isInQuiz={false} />
        <div className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="animate-spin text-6xl mb-4">⏳</div>
            <p className="text-gray-600">Načítám příklady z databáze...</p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ NOVÉ - zobrazení výsledků po dokončení testu
  if (showResults) {
    const results = getQuizResults();
    const currentArea = topicAreas.find((a) => a.id === currentQuizMode);

    return (
      <QuizResults
        results={results}
        topicArea={currentArea}
        onNavigate={onNavigate}
        onRetry={() => startQuiz(currentQuizMode)}
      />
    );
  }

  // Funkce pro požadavek na ukončení
  const handleRequestExit = () => {
    setShowExitConfirmation(true);
  };

  // Funkce pro zrušení ukončení
  const handleCancelExit = () => {
    setShowExitConfirmation(false);
  };

  // Funkce pro potvrzení ukončení
  const handleConfirmExit = () => {
    setSelectedOption(null);
    setShowFeedback(false);
    setResult(null);
    setShowAIExplanation(false);
    setAiExplanation("");
    setExplanationAttempt(1);
    setShowExitConfirmation(false);
    startQuiz(null);
    onNavigate("dashboard");
  };

  // ✅ Odeslání odpovědi - s ukládáním do databáze
  const handleSubmit = async () => {
    if (selectedOption && user?.id) {
      const answer = await submitAnswer(
        user.id,
        currentProblem.id,
        selectedOption
      );
      setResult(answer);
      setShowFeedback(true);
    }
  };

  // ✅ Přechod na další otázku nebo ukončení testu
  const handleNextQuestion = () => {
    setShowFeedback(false);
    setSelectedOption(null);
    setResult(null);
    setShowAIExplanation(false);
    setAiExplanation("");
    setExplanationAttempt(1);

    const nextProblem = moveToNextProblem();
    if (!nextProblem) {
      // Žádná další otázka - ukončit test a zobrazit výsledky
      console.log("✅ Test dokončen - zobrazuji výsledky");
      finishQuiz();
    }
  };

  // Žádost o AI vysvětlení
  const handleRequestExplanation = async () => {
    setShowFeedback(false);
    setShowAIExplanation(true);
    setLoadingExplanation(true);

    try {
      const { generateExplanation } = await import("./lib/aiService");
      const explanation = await generateExplanation(currentProblem, result, 1);
      setAiExplanation(explanation);
    } catch (error) {
      setAiExplanation(
        "Omlouváme se, vysvětlení se nepodařilo načíst. Zkuste to prosím znovu."
      );
    } finally {
      setLoadingExplanation(false);
    }
  };

  // Alternativní vysvětlení
  const handleStillDontUnderstand = async () => {
    setExplanationAttempt(2);
    setLoadingExplanation(true);

    try {
      const { generateExplanation } = await import("./lib/aiService");
      const explanation = await generateExplanation(currentProblem, result, 2);
      setAiExplanation(explanation);
    } catch (error) {
      setAiExplanation("Omlouváme se, vysvětlení se nepodařilo načíst.");
    } finally {
      setLoadingExplanation(false);
    }
  };

  // ✅ UPRAVENO - výpočet celkového počtu otázek v testu (vždy 10)
  const getTotalQuestions = () => {
    return 10; // Pevný limit
  };

  // Pokud není vybraná žádná otázka - výběr oblasti
  if (!currentProblem) {
    return (
      <div className="flex">
        <Sidebar activeItem="quiz" onNavigate={onNavigate} isInQuiz={false} />
        <div className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">
              Vyberte oblast pro testování
            </h1>
            <p className="text-gray-600 mb-2">
              Každý test obsahuje 10 náhodných otázek
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Klikněte na jednu z oblastí níže
            </p>
            <div className="grid gap-4">
              {topicAreas.map((area) => (
                // <Card
                //   key={area.id}
                //   className="p-6 cursor-pointer hover:shadow-lg transition-all"
                //   onClick={() => startQuiz(area.id)}
                // >
                //   <div className="flex items-center justify-between">
                //     <div className="flex items-center space-x-4">
                //       <span className="text-4xl">{area.icon}</span>
                //       <div className="text-left">
                //         <span className="text-xl font-semibold block">
                //           {area.name}
                //         </span>
                //         <span className="text-sm text-gray-500">
                //           10 náhodných otázek
                //         </span>
                //       </div>
                //     </div>
                //     <div className="text-blue-600 text-2xl">→</div>
                //   </div>
                // </Card>
                <Card
                  key={area.id}
                  className="p-6 cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => startQuiz(area.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-4xl">{area.icon}</span>
                      <div className="text-left">
                        <span className="text-xl font-semibold block">
                          {area.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          10 náhodných otázek
                        </span>
                      </div>
                    </div>
                    <div className="text-blue-600 text-2xl">→</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Hlavní kvízové rozhraní
  return (
    <div className="flex">
      <Sidebar
        activeItem="quiz"
        onNavigate={onNavigate}
        isInQuiz={true}
        onExitRequest={handleRequestExit}
      />

      <div className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* ✅ UPRAVENO - Hlavička s počítadlem otázek */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Otázka {currentSessionAnswers.length + 1} z{" "}
                {getTotalQuestions()}
              </h1>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      ((currentSessionAnswers.length + 1) /
                        getTotalQuestions()) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {currentProblem.year} • {currentProblem.difficulty_level}
              </div>
              <Button variant="outline" size="sm" onClick={handleRequestExit}>
                ← Ukončit test
              </Button>
            </div>
          </div>

          <Card className="mb-6">
            <h2 className="text-xl font-bold mb-4">{currentProblem.title}</h2>
            <p className="text-lg mb-6">{currentProblem.question_text}</p>
            <QuestionImage imageUrl={currentProblem.question_image_url} />
            <div className="space-y-3">
              {currentProblem.options.map((option) => (
                <AnswerOption
                  key={option.id}
                  option={option}
                  selected={selectedOption === option.id}
                  onChange={(e) => setSelectedOption(parseInt(e.target.value))}
                />
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={handleRequestExit}>
                Ukončit test
              </Button>
              <Button onClick={handleSubmit} disabled={!selectedOption}>
                Odeslat odpověď
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Feedback Modal - křížek spouští exit confirmation */}
      <Modal
        isOpen={showFeedback && !showExitConfirmation}
        onClose={handleRequestExit}
        title={result?.is_correct ? "Správně! 🎉" : "Nesprávně 😔"}
      >
        <div className="text-center">
          <div
            className={`text-6xl mb-4 ${
              result?.is_correct ? "text-green-500" : "text-red-500"
            }`}
          >
            {result?.is_correct ? "✓" : "✗"}
          </div>
          {result?.is_correct ? (
            <p className="text-lg text-green-600 mb-4">Výborně!</p>
          ) : (
            <div className="mb-4">
              <p className="text-lg text-red-600 mb-2">Správná odpověď byla:</p>
              <p className="font-semibold text-lg">
                {
                  currentProblem.options.find((o) => o.is_correct)
                    ?.option_letter
                }
                ){" "}
                {currentProblem.options.find((o) => o.is_correct)?.answer_text}
              </p>
            </div>
          )}
          <div className="flex space-x-3 justify-center">
            <Button onClick={handleNextQuestion} size="lg">
              K další otázce
            </Button>
            {!result?.is_correct && (
              <Button variant="outline" onClick={handleRequestExplanation}>
                💡 Potřebuji vysvětlení
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* AI Explanation Modal - křížek spouští exit confirmation */}
      <Modal
        isOpen={showAIExplanation && !showExitConfirmation}
        onClose={handleRequestExit}
        title="Pojďme si vysvětlit příklad"
      >
        <div className="max-h-[70vh] overflow-y-auto">
          {loadingExplanation ? (
            <div className="text-center py-8">
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <p className="text-gray-600">Připravuji vysvětlení...</p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <div
                className="whitespace-pre-wrap text-left"
                dangerouslySetInnerHTML={{
                  __html: aiExplanation
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(
                      /\[(.*?)\]\((.*?)\)/g,
                      '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>'
                    )
                    .replace(/\n/g, "<br/>"),
                }}
              />
            </div>
          )}
          <div className="flex space-x-3 justify-center mt-6 pt-4 border-t">
            <Button onClick={handleNextQuestion} size="lg">
              K další otázce
            </Button>
            {explanationAttempt === 1 && !loadingExplanation && (
              <Button variant="outline" onClick={handleStillDontUnderstand}>
                🤔 Pořád nechápu
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Exit Confirmation Modal */}
      <Modal
        isOpen={showExitConfirmation}
        onClose={handleCancelExit}
        title="Ukončit testování?"
      >
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-lg text-gray-700 mb-6">
            Opravdu chcete ukončit testování a přesunout se na hlavní stránku?
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Váš dosavadní pokrok bude uložen.
          </p>

          <div className="flex space-x-3 justify-center">
            <Button onClick={handleConfirmExit} variant="danger" size="lg">
              Ano, ukončit
            </Button>
            <Button variant="outline" onClick={handleCancelExit} size="lg">
              Ne, zůstat v testu
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Import Chart.js komponent
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

// Registrace Chart.js komponent
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Komponenta pro graf pokroku v čase
const ProgressChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>Zatím nejsou dostatečná data pro graf</p>
          <p className="text-sm mt-2">
            Začněte s testováním a vaše data se zde zobrazí
          </p>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: "Úspěšnost (%)",
        data: data.map((d) => d.accuracy),
        borderColor: "rgb(37, 99, 235)",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 4, // ✅ Větší body pro lepší viditelnost
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y}% úspěšnost`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value) => value + "%",
          stepSize: 20, // ✅ Krok po 20%
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)", // ✅ Jemnější mřížka
        },
      },
      x: {
        grid: {
          display: false, // ✅ Skrýt vertikální mřížku
        },
        ticks: {
          maxRotation: 45, // ✅ Rotace labelů pokud je jich hodně
          minRotation: 0,
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
};
// const ProgressChart = ({ data }) => {
//   if (!data || data.length === 0) {
//     return (
//       <div className="h-full flex items-center justify-center text-gray-500">
//         <div className="text-center">
//           <div className="text-4xl mb-2">📊</div>
//           <p>Zatím nejsou dostatečná data pro graf</p>
//         </div>
//       </div>
//     );
//   }

//   const chartData = {
//     labels: data.map((d) => d.date),
//     datasets: [
//       {
//         label: "Úspěšnost (%)",
//         data: data.map((d) => d.accuracy),
//         borderColor: "rgb(37, 99, 235)",
//         backgroundColor: "rgba(37, 99, 235, 0.1)",
//         tension: 0.4,
//         fill: true,
//       },
//     ],
//   };

//   const options = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: {
//         display: false,
//       },
//       tooltip: {
//         callbacks: {
//           label: (context) => `${context.parsed.y}% úspěšnost`,
//         },
//       },
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         max: 100,
//         ticks: {
//           callback: (value) => value + "%",
//         },
//       },
//     },
//   };

//   return <Line data={chartData} options={options} />;
// };

// Komponenta pro porovnání oblastí (Doughnut chart)
const AreasComparisonChart = ({ data }) => {
  if (!data || data.length === 0 || data.every((d) => d.total_problems === 0)) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>Zatím nejsou data</p>
        </div>
      </div>
    );
  }

  const colors = [
    "rgb(37, 99, 235)", // modrá
    "rgb(16, 185, 129)", // zelená
    "rgb(245, 158, 11)", // oranžová
    "rgb(139, 92, 246)", // fialová
  ];

  const chartData = {
    labels: data.map((d) => d.topic_name),
    datasets: [
      {
        data: data.map((d) => d.accuracy),
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 15,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.parsed || 0;
            return `${label}: ${value}%`;
          },
        },
      },
    },
  };

  return <Doughnut data={chartData} options={options} />;
};

const StatisticsPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const [overallStats, setOverallStats] = useState(null);
  const [topicStats, setTopicStats] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  //změna 30.10.2025
  const [timeRange, setTimeRange] = useState("month"); // 'week', 'month', '3months', 'all'

  // Načtení statistik
  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) return;

      setLoading(true);

      try {
        const { getOverallStats, getStatsByAllTopics, getProgressChartData } =
          await import("./lib/statsService");

        // Celkové statistiky
        const { data: overall } = await getOverallStats(user.id);
        if (overall) setOverallStats(overall);

        // Statistiky podle oblastí
        const { data: topics } = await getStatsByAllTopics(user.id);
        if (topics) setTopicStats(topics);

        // Data pro graf
        const { data: progress } = await getProgressChartData(
          user.id,
          timeRange
        );
        if (progress) setProgressData(progress);
      } catch (error) {
        console.error("Chyba při načítání statistik:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user, timeRange]);

  if (loading) {
    return (
      <div className="flex">
        <Sidebar activeItem="statistics" onNavigate={onNavigate} />
        <div className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-20">
              <div className="animate-spin text-6xl mb-4">⏳</div>
              <p className="text-gray-600">Načítám statistiky...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pokud nemá žádné odpovědi
  if (!overallStats || overallStats.totalProblems === 0) {
    return (
      <div className="flex">
        <Sidebar activeItem="statistics" onNavigate={onNavigate} />
        <div className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Statistiky</h1>
            <Card className="text-center py-16">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-bold mb-2">
                Zatím žádné statistiky
              </h2>
              <p className="text-gray-600 mb-6">
                Začněte s testováním a vaše statistiky se zde objeví.
              </p>
              <Button onClick={() => onNavigate("quiz")}>Začít testovat</Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar activeItem="statistics" onNavigate={onNavigate} />

      <div className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Revize & Statistiky</h1>
            <div className="flex space-x-3">
              {/* <select className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"> */}
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="week">Poslední týden</option>
                <option value="month">Poslední měsíc</option>
                <option value="3months">Poslední 3 měsíce</option>
                <option value="all">Celková historie</option>
              </select>
            </div>
          </div>

          {/* Přehledové karty */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Celková úspěšnost"
              value={`${overallStats.accuracy}%`}
              change={overallStats.accuracyChange}
              icon="📈"
            />
            <StatCard
              title="Celkem příkladů"
              value={overallStats.totalProblems}
              change={`${overallStats.correctAnswers} správně`}
              icon="📝"
            />
            <StatCard
              title="Průměrný čas"
              value={`${overallStats.averageTime} min`}
              change="na otázku"
              icon="⏱️"
            />
            <StatCard
              title="Nejdelší série"
              value={`${overallStats.maxStreak}`}
              change={`Aktuální: ${overallStats.streak}`}
              icon="🔥"
            />
          </div>

          {/* Grafy */}
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* Graf pokroku v čase */}
            <Card className="lg:col-span-2">
              <h3 className="text-xl font-bold mb-4">
                Vývoj úspěšnosti v čase
              </h3>
              <div className="h-64">
                <ProgressChart data={progressData} />
              </div>
            </Card>

            {/* Porovnání oblastí - doughnut chart */}
            <Card>
              <h3 className="text-xl font-bold mb-4">Porovnání oblastí</h3>
              <div className="h-64">
                <AreasComparisonChart data={topicStats} />
              </div>
            </Card>
          </div>

          {/* Detailní statistiky podle oblastí */}
          <Card>
            <h2 className="text-xl font-bold mb-4">
              Detailní statistiky podle oblastí
            </h2>

            {/* Taby pro oblasti */}
            <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
              {topicAreas.map((area, index) => {
                const stats = topicStats.find((s) => s.topic_id === area.id);
                return (
                  <button
                    key={area.id}
                    onClick={() => setActiveTab(index)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                      activeTab === index
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <span>{area.icon}</span>
                    <span>{area.name}</span>
                    {stats && stats.total_problems > 0 && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          activeTab === index ? "bg-blue-500" : "bg-gray-200"
                        }`}
                      >
                        {stats.accuracy}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Obsah vybraného tabu */}
            <div className="bg-gray-50 p-6 rounded-lg">
              {(() => {
                const currentArea = topicAreas[activeTab];
                const stats = topicStats.find(
                  (s) => s.topic_id === currentArea.id
                );

                if (!stats || stats.total_problems === 0) {
                  return (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">{currentArea.icon}</div>
                      <h3 className="text-lg font-bold mb-2">
                        {currentArea.name}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        V této oblasti jste zatím neřešili žádné příklady.
                      </p>
                      <Button onClick={() => onNavigate("quiz")}>
                        Začít testovat
                      </Button>
                    </div>
                  );
                }

                return (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <span className="text-2xl">{currentArea.icon}</span>
                          {currentArea.name}
                        </h3>
                        <p className="text-gray-600 mt-1">
                          {stats.correct_answers} správně z{" "}
                          {stats.total_problems} pokusů
                        </p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-3xl font-bold ${
                            stats.accuracy >= 80
                              ? "text-green-600"
                              : stats.accuracy >= 60
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {stats.accuracy}%
                        </div>
                        <div className="text-sm text-gray-500">úspěšnost</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Pokrok</span>
                        <span className="font-semibold">
                          {stats.correct_answers}/{stats.total_problems}
                        </span>
                      </div>
                      <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`absolute top-0 left-0 h-4 rounded-full transition-all ${
                            stats.accuracy >= 80
                              ? "bg-green-500"
                              : stats.accuracy >= 60
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${stats.accuracy}%` }}
                        />
                      </div>
                    </div>

                    {/* Akce */}
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => {
                          onNavigate("quiz");
                          // Můžete přidat automatické spuštění této oblasti
                        }}
                      >
                        Testovat oblast
                      </Button>
                      {stats.accuracy < 100 && (
                        <Button variant="outline">Procvičit chyby</Button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const ProfilePage = ({ onNavigate }) => (
  <div className="flex">
    <Sidebar activeItem="profile" onNavigate={onNavigate} />
    <div className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Profil</h1>
      <Card>
        <p className="text-gray-600">Profil bude implementován později...</p>
      </Card>
    </div>
  </div>
);

// =====================================================
// MAIN APP
// =====================================================
const App = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState("dashboard");

  useEffect(() => {
    const testDB = async () => {
      try {
        const { supabase } = await import("./lib/supabase");
        const { data, error } = await supabase
          .from("topic_areas")
          .select("*")
          .limit(1);
        if (error) {
          console.error("❌ Chyba připojení:", error);
        } else {
          console.log("✅ Supabase připojeno!", data);
        }
      } catch (err) {
        console.error("❌ Kritická chyba:", err);
      }
    };
    testDB();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Načítám...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LandingPage />;

  const renderPage = () => {
    switch (currentPage) {
      case "quiz":
        return <QuizPage onNavigate={setCurrentPage} />;
      case "statistics":
        return <StatisticsPage onNavigate={setCurrentPage} />;
      case "profile":
        return <ProfilePage onNavigate={setCurrentPage} />;
      default:
        return <DashboardPage onNavigate={setCurrentPage} />;
    }
  };

  return <div className="min-h-screen bg-gray-50">{renderPage()}</div>;
};

// =====================================================
// ROOT
// =====================================================
export default function MatemmatickesPrijimacky() {
  return (
    <AuthProvider>
      <QuizProvider>
        <App />
      </QuizProvider>
    </AuthProvider>
  );
}
