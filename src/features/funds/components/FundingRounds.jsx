import React from'react';import FundingRoundCard from'./FundingRoundCard';
export default function FundingRounds({rounds,...props}){return<section>{rounds.map(round=><FundingRoundCard key={round.id} round={round}{...props}/>)}</section>}
