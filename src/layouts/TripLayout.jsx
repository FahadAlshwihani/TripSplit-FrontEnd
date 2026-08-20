import React,{useMemo} from 'react';
import {NavLink,Outlet,useNavigate,useParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import MainLayout from '../components/Layout/MainLayout';
import Loading from '../components/Loading';
import ErrorState from '../shared/components/ErrorState';
import useRouteResource from '../shared/hooks/useRouteResource';
import {getTrip} from '../features/trips/api/tripsApi';
import {permissionsFor} from '../shared/utils/permissions';

export default function TripLayout(){
 const {tripId}=useParams(),navigate=useNavigate(),{t}=useTranslation();
 const resource=useRouteResource(signal=>getTrip(tripId,{signal}),tripId),trip=resource.data,setTrip=resource.setData;
 const currentMember=trip?.current_member;
 const permissions=useMemo(()=>permissionsFor(currentMember,Boolean(trip?.archived_at),trip?.lifecycle_status==='closed'),[currentMember,trip]);
 if(resource.loading)return <Loading/>;
 if(resource.error||!trip){const messages={403:'You do not have access to this trip.',404:'Trip not found.',trip_banned:'You cannot access this trip.',guest_access_invalid:'Your guest access has expired. Please join again.'};return <MainLayout><ErrorState title={t('error.loadTrip')} message={messages[resource.error?.code]||messages[resource.error?.status]||resource.error?.message} onRetry={resource.retry}/><button onClick={()=>navigate('/')}>{t('Home')}</button></MainLayout>}
 const sections=[['overview','trip.overview'],['expenses','expense.history'],['balances','balances.title'],['fund','fund.title'],['members','members.title'],['governance','governance.title'],['categories','categories.title'],['settlements','settlements.history'],['activity','activity.title'],['settings','settings.title']];
 return <MainLayout><main className="home-container-pc mt-5"><section className="card-pc trip-details-card"><h2>{trip.title}</h2><p>{t('trip.budget')}: {trip.budget} {trip.currency}</p><p>{t('trip.code')}: <strong>{trip.join_code}</strong></p><p>{t(`role.${currentMember?.role}`)}</p></section>{trip.archived_at&&<div className="archive-banner" role="status">{t('trip.archivedReadOnly')}</div>}<nav className="trip-section-nav" aria-label={t('trip.sections')}>{sections.map(([path,label])=><NavLink key={path} to={path} className={({isActive})=>isActive?'active':''}>{t(label)}</NavLink>)}</nav><Outlet context={{trip,setTrip,tripId,currentMember,permissions,reloadTrip:resource.retry}}/></main></MainLayout>;
}
