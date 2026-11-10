// ThingsBoard dashboards shown as bottom-nav tabs. Edit this list to change them.
export const DASHBOARDS = [
  { id: '0aefc640-3a40-11f1-b8ba-0b85bde787de', icon: '🏟️', label: 'Gymnasium' },
  { id: '44de3680-a501-11f1-8033-a3328dc62c1a', icon: '💡', label: 'เสาไฟสนามบอล' },
  { id: 'a57e4400-033d-11f1-8106-e9a9e913375f', icon: '🏊', label: 'สระว่ายน้ำ' },
]

// The "PWA Usage" device that pushbridge's /track writes to. The report tab (tenant
// admins only) reads it. Keep it unassigned to any customer in ThingsBoard — that, not
// hiding the tab, is what stops other users from reading it.
export const USAGE_DEVICE_ID = '5ca110f0-dcef-11f1-905b-a3328dc62c1a'
