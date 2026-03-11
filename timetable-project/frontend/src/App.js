import { useState } from "react";
import Departments from "./pages/Departments";
import Classes from "./pages/Classes";
import Timetable from "./pages/Timetable";

function App() {
  const [department, setDepartment] = useState(null);
  const [className, setClassName] = useState(null);

  if (!department)
    return <Departments setDepartment={setDepartment} />;

  if (!className)
    return <Classes department={department} setClassName={setClassName} />;

  return <Timetable className={className} />;
}

export default App;
