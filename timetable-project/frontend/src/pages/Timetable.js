import { useEffect, useState } from "react";

function Timetable({ className }) {

  const [timetable, setTimetable] = useState({});

  useEffect(() => {

    fetch(`http://localhost:5001/timetable/${className}`)
      .then(res => res.json())
      .then(data => {
        console.log("API DATA:", data);
        setTimetable(data);
      });

  }, [className]);

  const days = [
    { id: 1, name: "Monday" },
    { id: 2, name: "Tuesday" },
    { id: 3, name: "Wednesday" },
    { id: 4, name: "Thursday" },
    { id: 5, name: "Friday" },
    { id: 6, name: "Saturday" }
  ];

  const periods = [1,2,3,4,5,6,7,8];

  return (

    <div style={{ padding: "20px" }}>

      <h2 style={{ textAlign: "center" }}>
        Timetable - {className}
      </h2>

      <table
        border="1"
        cellPadding="10"
        style={{
          borderCollapse: "collapse",
          width: "100%",
          textAlign: "center"
        }}
      >

        <thead>
          <tr>

            <th>Day</th>

            <th>1<br/>08:00</th>
            <th>2<br/>08:45</th>


            <th style={{background:"#ddd"}}>Break</th>

            <th>3<br/>09:45</th>
            <th>4<br/>10:30</th>
            <th>5<br/>11:15</th>

            <th style={{background:"#ddd"}}>Lunch</th>

            <th>6<br/>13:00</th>
            <th>7<br/>13:45</th>
            <th>8<br/>14:30</th>

          </tr>
        </thead>
        
        <tbody>

{days.map(day => {

  let skip = 0;
  const cells = [];

  periods.forEach(period => {

    if (skip > 0) {
      skip--;
      return;
    }

    const cell = timetable?.[day.id]?.[period];

    if (cell?.span > 1) {
      skip = cell.span - 1;
    }

    cells.push(
      <td key={period} colSpan={cell?.span || 1}>
        {cell && (
          <>
            <div style={{fontWeight:"bold"}}>
              {cell.subject}
            </div>

            <div style={{fontSize:"12px"}}>
              {cell.staff}
            </div>
          </>
        )}
      </td>
    );

    /* INSERT BREAK COLUMN AFTER PERIOD 2 */

    if(period === 2){
      cells.push(
        <td key={`break-${day.id}`} style={{background:"#eee", fontWeight:"bold"}}>
          Break
        </td>
      );
    }

    /* INSERT LUNCH COLUMN AFTER PERIOD 5 */

    if(period === 5){
      cells.push(
        <td key={`lunch-${day.id}`} style={{background:"#eee", fontWeight:"bold"}}>
          Lunch
        </td>
      );
    }

  });

  return (
    <tr key={day.id}>
      <td style={{fontWeight:"bold"}}>{day.name}</td>
      {cells}
    </tr>
  );

})}

</tbody>

      </table>

    </div>

  );

}

export default Timetable;