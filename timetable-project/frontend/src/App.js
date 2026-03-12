import { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Departments from "./pages/Departments";
import Classes from "./pages/Classes";
import Timetable from "./pages/Timetable";
import "./App.css";

function App() {
  const [department, setDepartment] = useState(null);
  const [className, setClassName] = useState(null);

  const goBackToDepartments = () => {
    setDepartment(null);
    setClassName(null);
  };

  const goBackToClasses = () => {
    setClassName(null);
  };

  let content;

  if (!department) {
    content = <Departments setDepartment={setDepartment} />;
  } else if (!className) {
    content = (
      <Classes
        department={department}
        setClassName={setClassName}
        onBack={goBackToDepartments}
      />
    );
  } else {
    content = <Timetable className={className} onBack={goBackToClasses} />;
  }

  return (
    <div className="app-layout">
      <Header />
      <main className="app-main">{content}</main>
      <Footer />
    </div>
  );
}

export default App;
