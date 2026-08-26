import React from'react';import FundingRoundCard from'./FundingRoundCard';
export default function FundingRounds({rounds,onRemind,...props}){return<section>{rounds.map(round=><FundingRoundCard key={round.id} round={round} onRemind={onRemind?memberId=>onRemind(round,memberId):undefined}{...props}/>)}</section>}
