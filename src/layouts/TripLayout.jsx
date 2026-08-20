import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {NavLink,Outlet,useNavigate,useParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import MainLayout from '../components/Layout/MainLayout';
import Loading from '../components/Loading';
import ErrorState from '../shared/components/ErrorState';
import {getTrip} from '../features/trips/api/tripsApi';
import {permissionsFor} from '../shared/utils/permissions';

export default function TripLayout(){
 const {tripId}=useParams(),navigate=useNavigate(),{t}=useTranslation();
 const [trip,setTrip]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(null);
 const reloadTrip=useCallback(async()=>{setLoading(true);setError(null);try{setTrip(await getTrip(tripId));}catch(reason){setError(reason);}finally{setLoading(false);}},[tripId]);
 useEffect(()=>{reloadTrip();},[reloadTrip]);
 const currentMember=trip?.current_member;
 const permissions=useMemo(()=>permissionsFor(currentMember,Boolean(trip?.archived_at),trip?.lifecycle_status==='closed'),[currentMember,trip]);
 if(loading)return <Loading/>;
 if(!trip)return <MainLayout><ErrorState title={t('error.loadTrip')} message={error?.message} onRetry={reloadTrip}/><button onClick={()=>navigate('/')}>{t('Home')}</button></MainLayout>;
 const sections=[['overview','trip.overview'],['expenses','expense.history'],['balances','balances.title'],['fund','fund.title'],['members','members.title'],['governance','governance.title'],['categories','categories.title'],['settlements','settlements.history'],['activity','activity.title'],['settings','settings.title']];
 return <MainLayout><main className="home-container-pc mt-5"><section className="card-pc trip-details-card"><h2>{trip.title}</h2><p>{t('trip.budget')}: {trip.budget} {trip.currency}</p><p>{t('trip.code')}: <strong>{trip.join_code}</strong></p><p>{t(`role.${currentMember?.role}`)}</p></section>{trip.archived_at&&<div className="archive-banner" role="status">{t('trip.archivedReadOnly')}</div>}<nav className="trip-section-nav" aria-label={t('trip.sections')}>{sections.map(([path,label])=><NavLink key={path} to={path} className={({isActive})=>isActive?'active':''}>{t(label)}</NavLink>)}</nav><Outlet context={{trip,setTrip,tripId,currentMember,permissions,reloadTrip}}/></main></MainLayout>;
}
