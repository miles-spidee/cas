import "./Footer.css";

function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <span>&copy; {new Date().getFullYear()} Timetable Manager</span>
        <span className="footer-sep">|</span>
        <span>College Academic Scheduler</span>
      </div>
    </footer>
  );
}

export default Footer;
