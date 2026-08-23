import React from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
export default function JoinRequestsSection({ requests, onReview }) { const { t }=useTranslation(); return <section><h3>{t('governance.requests')} ({requests.length})</h3>{requests.map(row=><div className="management-row" key={row.id}><span className="member-avatar"><Avatar avatarKey={avatarKeyFromAvatar(row.avatar)} displayName={row.display_name} size="sm" /></span><div><strong>{row.display_name}</strong><small>{t(`identity.${row.identity_type}`)}</small></div><div className="row-actions"><button onClick={()=>onReview(row,'approve')}>{t('governance.approve')}</button><button onClick={()=>onReview(row,'reject')}>{t('governance.reject')}</button></div></div>)}{!requests.length&&<p>{t('governance.noRequests')}</p>}</section>; }
