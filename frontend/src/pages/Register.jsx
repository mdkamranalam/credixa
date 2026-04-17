import { useState, useContext, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import {
  UserPlus,
  Mail,
  Lock,
  Phone,
  CreditCard,
  AlertCircle,
  CircleCheck,
  Building,
  GraduationCap,
  Landmark,
  MapPin,
  Hash,
  FileDigit,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext.jsx";
import api from "../services/api.js";

const Register = () => {
  const navigate = useNavigate();
  const { type } = useParams();
  const { register } = useContext(AuthContext);

  // --- UI STATE ---
  const activeTab = type === "institution" ? "INSTITUTION" : "STUDENT";
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- STUDENT FORM STATE ---
  const [institutions, setInstitutions] = useState([]);
  const [collegeSearch, setCollegeSearch] = useState("");
  const [studentData, setStudentData] = useState({
    full_name: "",
    email: "",
    mobile_number: "",
    dob: "",
    password: "",
    role: "STUDENT",
    college_roll_number: "",
    institution_id: "",
  });

  // --- PASSWORD STRENGTH CALCULATION ---
  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length > 0) strength += 1;
    if (password.length > 5) strength += 1;
    if (password.length > 7) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return Math.min(strength, 5);
  };
  
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong", "Excellent"];
  const strengthColors = ["bg-gray-200", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500", "bg-green-500"];


  // --- INSTITUTION FORM STATE ---
  const [instData, setInstData] = useState({
    name: "",
    code: "",
    contact_email: "",
    password: "",
    address: "",
    bank_account_number: "",
    ifsc_code: "",
    bank_name: "",
  });

  // Fetch colleges for the Student dropdown
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await api.get("/auth/institutions");
        setInstitutions(response.data);
      } catch (err) {
        console.error("Failed to load colleges", err);
      }
    };
    fetchColleges();
  }, []);

  // Handlers for input changes
  const handleStudentChange = (e) =>
    setStudentData({ ...studentData, [e.target.name]: e.target.value });
  const handleInstChange = (e) =>
    setInstData({ ...instData, [e.target.name]: e.target.value });

  // Main Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (activeTab === "STUDENT") {
        // --- Process Student Registration ---
        const selectedCollege = institutions.find(
          (inst) =>
            inst.name.trim().toLowerCase() ===
            collegeSearch.trim().toLowerCase(),
        );

        if (!selectedCollege) {
          setError(
            "Institution not found. Please register the college first using the Institution tab.",
          );
          setIsLoading(false);
          return;
        }

        const payload = {
          ...studentData,
          institution_id: selectedCollege.institution_id,
        };
        await register(payload); 
        setSuccess("Student account created! Redirecting...");
      } else {
        // --- Process Institution Registration ---
        await api.post("/auth/register-institution", instData);
        setSuccess(
          "Institution registered perfectly! You can now register students for this college.",
        );
      }

      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setError(
        error.response?.data?.error || error.message || "Registration failed.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Join <span className="text-emerald-500">Credixa</span>
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          {/* Messages */}
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 flex items-center">
              <CircleCheck className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* ========================================= */}
            {/* STUDENT FORM                 */}
            {/* ========================================= */}
            {activeTab === "STUDENT" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserPlus className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="full_name"
                        required
                        className="pl-10 w-full sm:text-sm border-gray-300 rounded-md py-2 border focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="John Doe"
                        value={studentData.full_name}
                        onChange={handleStudentChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        required
                        className="pl-10 w-full sm:text-sm border-gray-300 rounded-md py-2 border focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="student@edu.in"
                        value={studentData.email}
                        onChange={handleStudentChange}
                      />
                    </div>
                  </div>
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700">
                    College / Institution
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      list="college-list"
                      type="text"
                      required
                      className="pl-10 w-full sm:text-sm border-gray-300 rounded-md py-2 border focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Start typing your college name..."
                      value={collegeSearch}
                      onChange={(e) => setCollegeSearch(e.target.value)}
                    />
                    <datalist id="college-list">
                      {institutions.map((inst) => (
                        <option key={inst.institution_id} value={inst.name} />
                      ))}
                    </datalist>
                  </div>
                </div> */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    College / Institution
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      list="college-list"
                      type="text"
                      required
                      className="pl-10 w-full sm:text-sm border-gray-300 rounded-md py-2 border focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Start typing (e.g. BITS Pilani)"
                      value={collegeSearch}
                      onChange={(e) => setCollegeSearch(e.target.value)}
                    />
                    <datalist id="college-list">
                      {institutions.map((inst) => (
                        <option key={inst.institution_id} value={inst.name} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      College Roll / ID
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="college_roll_number"
                        required
                        className="pl-10 w-full sm:text-sm border-gray-300 rounded-md py-2 border uppercase focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="CS2024-001"
                        value={studentData.college_roll_number}
                        onChange={handleStudentChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Mobile Number
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="mobile_number"
                        required
                        pattern="[0-9]{10}"
                        title="Exactly 10 digits required"
                        className="pl-10 w-full sm:text-sm border-gray-300 rounded-md py-2 border focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="9876543210"
                        value={studentData.mobile_number}
                        onChange={handleStudentChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date of Birth
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="dob"
                        required
                        className="pl-10 w-full sm:text-sm border-gray-300 rounded-md py-2 border uppercase focus:ring-emerald-500 focus:border-emerald-500"
                        value={studentData.dob}
                        onChange={handleStudentChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        name="password"
                        required
                        className="pl-10 w-full sm:text-sm border-gray-300 rounded-md py-2 border focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="••••••••"
                        value={studentData.password}
                        onChange={handleStudentChange}
                      />
                    </div>
                    {studentData.password && (
                      <div className="mt-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-semibold text-gray-500">Strength</span>
                          <span className={`text-xs font-bold ${strengthColors[getPasswordStrength(studentData.password)].replace('bg-', 'text-')}`}>
                            {strengthLabels[getPasswordStrength(studentData.password)]}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div 
                              key={level} 
                              className={`h-1.5 flex-1 rounded-full ${level <= getPasswordStrength(studentData.password) ? strengthColors[getPasswordStrength(studentData.password)] : 'bg-gray-200'}`}
                            ></div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ========================================= */}
            {/* INSTITUTION FORM               */}
            {/* ========================================= */}
            {activeTab === "INSTITUTION" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Institution Name
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      required
                      className="pl-10 w-full sm:text-sm border-gray-300 rounded-md py-2 border focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="e.g. BITS Pilani"
                      value={instData.name}
                      onChange={handleInstChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Institution Code
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="code"
                        required
                        className="pl-10 w-full sm:text-sm border-gray-300 rounded-md py-2 border uppercase focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="BITS-001"
                        value={instData.code}
                        onChange={handleInstChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Admin Email
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="contact_email"
                        required
                        className="pl-10 w-full sm:text-sm border-gray-300 rounded-md py-2 border focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="admin@bits.edu"
                        value={instData.contact_email}
                        onChange={handleInstChange}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Admin Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      required
                      className="pl-10 w-full sm:text-sm border-gray-300 rounded-md py-2 border focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="••••••••"
                      value={instData.password}
                      onChange={handleInstChange}
                    />
                  </div>
                </div>

                <hr className="my-6 border-gray-200" />
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                  Banking Details (For Disbursal)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Bank Name
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Landmark className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="bank_name"
                        required
                        className="pl-10 w-full sm:text-sm border-gray-300 rounded-md py-2 border focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="HDFC Bank"
                        value={instData.bank_name}
                        onChange={handleInstChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      IFSC Code
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FileDigit className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="ifsc_code"
                        required
                        className="pl-10 w-full sm:text-sm border-gray-300 rounded-md py-2 border uppercase focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="HDFC0001234"
                        value={instData.ifsc_code.toUpperCase()}
                        onChange={handleInstChange}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Account Number
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="bank_account_number"
                      required
                      className="pl-10 w-full sm:text-sm border-gray-300 rounded-md py-2 border focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="0000111122223333"
                      value={instData.bank_account_number}
                      onChange={handleInstChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Official Address
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="address"
                      required
                      className="pl-10 w-full sm:text-sm border-gray-300 rounded-md py-2 border focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="123 Tech Park, Bangalore"
                      value={instData.address}
                      onChange={handleInstChange}
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-500 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:bg-emerald-500 transition-colors"
            >
              {isLoading
                ? "Processing..."
                : `Register as ${activeTab === "STUDENT" ? "Student" : "Institution"}`}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-emerald-500 hover:text-emerald-500/80"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;