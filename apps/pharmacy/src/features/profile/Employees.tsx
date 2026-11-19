'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge, Button, Icon, Text, TextField, cssVar } from '@medfind/ui/web';
import { Shell } from '../reservations/Shell';
import { newStaffCode, updateWorkspace, useWorkspace, type Employee, type Role } from '../workspace/store';
import { Avatar, CodeBox, EmptyState, Modal, PageHeading, Pager, Skeleton, Tabs, WarningNote, dmyOf, downloadCsv, notify, useFirstLoad, usePaged } from '../common/ui';
import c from '../common/common.module.css';

const COLS = { gridTemplateColumns: '2fr 1.3fr 1fr 1fr 1fr 0.9fr 32px' };
const ROLES: Role[] = ['Pharmacist', 'Junior Pharmacist', 'Manager/ Pharmacist', 'Cashier'];
const CAN: Record<Role, [string, boolean][]> = {
  'Superintendent pharmacist': [],
  'Manager/ Pharmacist': [['Approve or decline prescriptions', true], ['Take counter payments and hand over medicine', true], ['Add stock and change prices', true], ['Add or remove employees', true]],
  Pharmacist: [['Approve or decline prescriptions', true], ['Take counter payments and hand over medicine', true], ['Add stock and change prices', false], ['Add or remove employees', false]],
  'Junior Pharmacist': [['Approve or decline prescriptions', false], ['Take counter payments and hand over medicine', true], ['Add stock and change prices', false], ['Add or remove employees', false]],
  Cashier: [['Approve or decline prescriptions', false], ['Take counter payments and hand over medicine', true], ['Add stock and change prices', false], ['Add or remove employees', false]],
};

type Flow =
  | { step: 'add' }
  | { step: 'creating'; name: string; role: Role; reason: 'new' | 'reset' }
  | { step: 'ready'; name: string; role: Role; code: string; reason: 'new' | 'reset' }
  | { step: 'confirm-reset'; employee: Employee }
  | null;

/** Employees (Figma 601:17433) and the add / staff code popups (2039:14614 … 2039:16393). */
export function Employees() {
  const router = useRouter();
  const params = useSearchParams();
  const w = useWorkspace();
  const loading = useFirstLoad('employees');
  const [tab, setTab] = useState<'active' | 'inactive'>('active');
  const [flow, setFlow] = useState<Flow>(params.get('add') ? { step: 'add' } : null);
  const [shown, setShown] = useState<string[]>([]);
  const [menu, setMenu] = useState<string | null>(null);
  const rows = w.employees.filter((e) => e.active === (tab === 'active'));
  const paged = usePaged(rows, tab);

  const startCode = (name: string, role: Role, reason: 'new' | 'reset', employeeId?: string, extra?: Partial<Employee>) => {
    setFlow({ step: 'creating', name, role, reason });
    setTimeout(() => {
      const code = newStaffCode(w.employees.map((e) => e.code));
      if (reason === 'new') {
        updateWorkspace(
          (st) => ({ employees: [{ id: `e${Date.now()}`, name, role, phone: extra?.phone ?? '', email: extra?.email ?? '', code, addedAt: new Date().toISOString().slice(0, 10), active: true }, ...st.employees] }),
          { kind: 'account', text: `Added ${name} as ${role} and created a staff code`, statuses: [{ label: 'Employee added', tone: 'success' }] },
        );
      } else {
        updateWorkspace((st) => ({ employees: st.employees.map((e) => (e.id === employeeId ? { ...e, code } : e)) }), {
          kind: 'account',
          text: `Created a new staff code for ${name}. The old code stopped working.`,
          statuses: [{ label: 'New code', tone: 'info' }],
        });
      }
      setFlow({ step: 'ready', name, role, code, reason });
    }, 1200);
  };

  const closeReady = (sent: boolean) => {
    if (flow?.step !== 'ready') return;
    notify(
      flow.reason === 'new' ? `${flow.name} is added` : `New code for ${flow.name}`,
      sent ? `We texted the code to ${flow.name.split(' ')[0]}. (Demo: no SMS is sent.)` : `${flow.name.split(' ')[0]} enters the code to start a shift.`,
    );
    setFlow(null);
    setTab('active');
  };

  const setActive = (e: Employee, active: boolean) => {
    setMenu(null);
    updateWorkspace((st) => ({ employees: st.employees.map((x) => (x.id === e.id ? { ...x, active } : x)) }), {
      kind: 'account',
      text: `${active ? 'Reactivated' : 'Deactivated'} ${e.name}`,
      statuses: [{ label: active ? 'Active' : 'Inactive', tone: active ? 'success' : 'neutral' }],
    });
    notify(active ? `${e.name} is active again` : `${e.name} is deactivated`, active ? 'Their staff code works again.' : 'Their staff code stops working straight away. You can reactivate them from Inactive.', 'info');
  };

  return (
    <Shell
      active="profile"
      heading={<PageHeading title="Employees" subtitle="Add your team and give everyone their own staff code." crumbs={{ label: 'Profile and hours', href: '/profile' }} />}
      actions={
        <>
          <Button label="Export" variant="secondary" size="medium" iconLeft="upload" onPress={() => downloadCsv('fuasi-employees.csv', [['Name', 'Role', 'Phone', 'Email', 'Date added', 'Status'], ...w.employees.map((e) => [e.name, e.role, e.phone, e.email, dmyOf(e.addedAt), e.active ? 'Active' : 'Inactive'])])} />
          <Button label="Add employees" size="medium" iconLeft="add" onPress={() => setFlow({ step: 'add' })} />
        </>
      }
    >
      {loading ? (
        <Skeleton rows={6} />
      ) : (
        <div className={c.stack24}>
          <Tabs
            tabs={[
              { key: 'active', label: 'Active', count: w.employees.filter((e) => e.active).length },
              { key: 'inactive', label: 'Inactive', count: w.employees.filter((e) => !e.active).length },
            ]}
            value={tab}
            onChange={setTab}
          />
          <div className={c.tableCard}>
            <div className={`${c.thead} mf-t-caption1`} style={COLS}>
              <span>Employee</span>
              <span>Role</span>
              <span>Code</span>
              <span>New code</span>
              <span>Date added</span>
              <span>Status</span>
              <span />
            </div>
            {paged.rows.map((e) => (
              <div key={e.id} className={c.trow} style={COLS}>
                <span className={c.row8} style={{ gap: 16 }}>
                  <Avatar name={e.name} size={48} />
                  <Text variant="body1">{e.name}</Text>
                </span>
                <Text variant="caption1" color={cssVar.text.secondary}>
                  {e.role}
                </Text>
                <span className={c.row8}>
                  <Text variant="caption1">{shown.includes(e.id) ? e.code : `••••${e.code.slice(-2)}`}</Text>
                  <button type="button" className={c.linkBtn} style={{ color: cssVar.text.secondary }} onClick={() => setShown((x) => (x.includes(e.id) ? x.filter((y) => y !== e.id) : [...x, e.id]))} aria-label={shown.includes(e.id) ? `Hide ${e.name}’s code` : `Show ${e.name}’s code`}>
                    <Icon name={shown.includes(e.id) ? 'hide' : 'show'} size={16} />
                  </button>
                </span>
                <span>
                  {e.active ? (
                    <button type="button" className={`${c.linkBtn} mf-t-label1`} onClick={() => setFlow({ step: 'confirm-reset', employee: e })}>
                      Get new code
                    </button>
                  ) : (
                    <Text variant="caption1" color={cssVar.text.secondary}>
                      —
                    </Text>
                  )}
                </span>
                <Text variant="body2">{dmyOf(e.addedAt)}</Text>
                <span>
                  <Badge label={e.active ? 'Active' : 'Inactive'} tone={e.active ? 'success' : 'neutral'} dot="left" />
                </span>
                <span style={{ position: 'relative' }}>
                  <button type="button" className={c.linkBtn} style={{ color: cssVar.text.heading, fontSize: 22, lineHeight: 1 }} aria-label={`More for ${e.name}`} onClick={() => setMenu(menu === e.id ? null : e.id)}>
                    ⋮
                  </button>
                  {menu === e.id && (
                    <div className={c.menu}>
                      {e.role === 'Superintendent pharmacist' ? (
                        <span className={`${c.menuItem} mf-t-label2`}>The superintendent can’t be deactivated</span>
                      ) : (
                        <button type="button" className={`${c.menuItem} mf-t-label1`} onClick={() => setActive(e, !e.active)}>
                          {e.active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      )}
                      <button type="button" className={`${c.menuItem} mf-t-label1`} onClick={() => { setMenu(null); router.push('/profile/shifts'); }}>
                        View shifts
                      </button>
                    </div>
                  )}
                </span>
              </div>
            ))}
            {paged.total === 0 && (
              <EmptyState
                icon="store"
                title={tab === 'active' ? 'No employees yet' : 'No inactive employees'}
                body={tab === 'active' ? 'Give each employee their own staff code, so whoever is on shift can reply in time.' : 'People you deactivate show up here. You can bring them back any time.'}
                action={tab === 'active' ? <Button label="Add an employee" onPress={() => setFlow({ step: 'add' })} /> : undefined}
              />
            )}
            <Pager {...paged} />
          </div>
        </div>
      )}

      {flow?.step === 'add' && <AddEmployee onClose={() => setFlow(null)} onAdd={(name, role, phone, email) => startCode(name, role, 'new', undefined, { phone, email })} />}
      {flow?.step === 'creating' && (
        <Modal title="Creating a staff code…" subtitle={`Making a 5-digit code for ${flow.name}.`} onClose={() => {}} width={420}>
          <div style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
            <span className="mf-spinner" style={{ width: 40, height: 40, color: cssVar.brand.default }} />
          </div>
        </Modal>
      )}
      {flow?.step === 'ready' && (
        <Modal
          icon="tick-circle"
          title={flow.reason === 'new' ? `${flow.name} is added` : `New code for ${flow.name}`}
          subtitle={`Here’s ${flow.name.split(' ')[0]}’s staff code. They enter it to start a shift and to sign what they do in the activity log.`}
          onClose={() => closeReady(false)}
          footer={
            <>
              <Button
                label="Copy code"
                variant="secondary"
                onPress={() => {
                  navigator.clipboard?.writeText(flow.code).catch(() => {});
                  notify('Code copied', `${flow.code} is on your clipboard.`, 'info');
                }}
              />
              <Button label="Send by SMS" onPress={() => closeReady(true)} />
            </>
          }
        >
          <CodeBox code={flow.code} caption={`Staff code · ${flow.role}`} />
          <WarningNote title="We only show this code once" body={`Copy it or send it now. You can create a new code for ${flow.name.split(' ')[0]} at any time from the employee list.`} />
        </Modal>
      )}
      {flow?.step === 'confirm-reset' && (
        <Modal
          width={440}
          title={`Create a new code for ${flow.employee.name}?`}
          subtitle={`Their current code stops working straight away. They’ll need the new code to start their next shift.`}
          onClose={() => setFlow(null)}
          footer={
            <>
              <Button label="Cancel" variant="secondary" onPress={() => setFlow(null)} />
              <Button label="Create new code" onPress={() => startCode(flow.employee.name, flow.employee.role, 'reset', flow.employee.id)} />
            </>
          }
        />
      )}
    </Shell>
  );
}

function AddEmployee({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, role: Role, phone: string, email: string) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('Pharmacist');
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const submit = () => {
    const e: typeof errors = {};
    if (name.trim().split(/\s+/).length < 2) e.name = 'Enter their first and last name';
    if (phone.replace(/\D/g, '').length < 10) e.phone = 'Enter an 11-digit phone number, e.g. 0803 000 2291';
    if (email && !/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter a valid email or leave it empty';
    setErrors(e);
    if (!Object.keys(e).length) onAdd(name.trim(), role, phone.trim(), email.trim());
  };
  return (
    <Modal
      title="Add an employee"
      subtitle="They get their own staff code to start shifts and sign their work."
      width={560}
      onClose={onClose}
      footer={
        <>
          <Button label="Cancel" variant="secondary" onPress={onClose} />
          <Button label="Add and create code" onPress={submit} />
        </>
      }
    >
      <TextField label="Full name" required size="web" placeholder="e.g. Olu Jason" value={name} onChangeText={setName} errorText={errors.name} autoComplete="name" />
      <div className={c.grid2} style={{ gap: 16 }}>
        <TextField label="Phone number" required size="web" placeholder="0803 000 2291" value={phone} onChangeText={setPhone} errorText={errors.phone} keyboard="phone" />
        <TextField label="Email" size="web" placeholder="Optional" value={email} onChangeText={setEmail} errorText={errors.email} keyboard="email" />
      </div>
      <label className={c.stack8}>
        <Text variant="label1" color={cssVar.input.label}>
          Role<span style={{ color: cssVar.text.required }}> *</span>
        </Text>
        <select className={`${c.select} mf-t-label2`} value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {ROLES.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      <div className={c.panel} style={{ background: cssVar.brandSubtle, gap: 12 }}>
        <Text variant="label1" color={cssVar.text.heading}>
          A {role.toLowerCase().replace('/ ', ' / ')} can
        </Text>
        {CAN[role].map(([t, ok]) => (
          <span key={t} className={c.row8} style={{ color: ok ? cssVar.text.success : cssVar.text.secondary }}>
            <Icon name={ok ? 'tick-circle' : 'danger-circle'} size={16} />
            <Text variant="caption1" color={ok ? cssVar.text.heading : cssVar.text.secondary}>
              {t}
            </Text>
          </span>
        ))}
      </div>
    </Modal>
  );
}
