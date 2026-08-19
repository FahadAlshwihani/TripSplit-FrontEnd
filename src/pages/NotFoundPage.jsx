import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/NotFoundPage.css';

const NotFoundPage = () => {
  const visorRef = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    const canvas = visorRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d');
    context.beginPath(); context.moveTo(5, 45); context.bezierCurveTo(15, 64, 45, 64, 55, 45); context.lineTo(55, 20); context.bezierCurveTo(55, 15, 50, 10, 45, 10); context.lineTo(15, 10); context.bezierCurveTo(10, 10, 5, 15, 5, 20); context.closePath(); context.fillStyle = '#2f3640'; context.strokeStyle = '#f5f6fa'; context.fill(); context.stroke();
    return undefined;
  }, []);
  return <div className="not-found-page"><div className="moon"></div>{[1,2,3].map((item) => <div key={item} className={`moon__crater moon__crater${item}`}></div>)}{[1,2,3,4,5].map((item) => <div key={item} className={`star star${item}`}></div>)}<div className="error"><div className="error__title">404</div><div className="error__subtitle">Lost in space</div><div className="error__description">This Trip Split page does not exist.</div><button className="error__button error__button--active" onClick={() => navigate('/')}>HOME</button><button className="error__button" onClick={() => navigate('/about')}>ABOUT</button></div><div className="astronaut"><div className="astronaut__backpack"></div><div className="astronaut__body"></div><div className="astronaut__head"><canvas ref={visorRef} width="60" height="60" aria-label="Astronaut visor"></canvas></div></div></div>;
};
export default NotFoundPage;
