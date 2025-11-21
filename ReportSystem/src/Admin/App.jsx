import { Link, useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import "./App.css";
import "../theme/tokens.css";
import Navigation from "../Navigation.jsx";

export default function App() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("currentUser");
    navigate("/login", { replace: true });
  };

  const tiles = [
    {
      title: "Admin View",
      desc: "Manage and update reports.",
      to: "/report",
      variant: "outline-light",
    },
    {
      title: "Analytics",
      desc: "See trends and totals.",
      to: "/analytics",
      variant: "primary",
    },
  ];

  return (
    <div className="app-landing">
      <Navigation />

      <Container className="content">
        <header className="hero">
          <h1>BFMO Report System</h1>
          <p className="subtitle">DLSU Dasmariñas</p>
        </header>

        <Row xs={1} md={2} lg={2} className="g-4 justify-content-center">
          {tiles.map((t, i) => (
            <Col key={i}>
              <Card className="tile-card h-100">
                <Card.Body className="tile-body">
                  <div className="tile-badge" aria-hidden>
                    ●
                  </div>
                  <Card.Title className="tile-title">{t.title}</Card.Title>
                  <Card.Text className="tile-desc">{t.desc}</Card.Text>

                  {t.external ? (
                    <Button
                      as="a"
                      href={t.to}
                      target="_blank"
                      rel="noreferrer"
                      variant={t.variant}
                      className="w-100"
                    >
                      Open
                    </Button>
                  ) : (
                    <Button
                      as={Link}
                      to={t.to}
                      variant={t.variant}
                      className="w-100"
                    >
                      Open
                    </Button>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <div className="landing-actions">


          {/* Animated Logout button */}
          <button className="Btn" onClick={logout} title="Logout">
            <div className="sign">
              <svg viewBox="0 0 512 512" aria-hidden="true">
                <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z" />
              </svg>
            </div>
            <div className="text">Logout</div>
          </button>
        </div>
      </Container>
    </div>
  );
}
