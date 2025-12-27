from app import init_db, SessionLocal, Issue
from datetime import datetime

def seed():
    init_db()
    s = SessionLocal()
    existing = s.query(Issue).filter(Issue.ref_id=='SC-EXAMPLE-0001').first()
    if existing:
        print('Seed already present')
        return
    issue = Issue(ref_id='SC-EXAMPLE-0001', city='Metroville', area='Downtown', street='Elm Street', issue_type='Broken Streetlight', description='Lamp not turning on during night', email='citizen@example.com', status='open', created_at=datetime.utcnow())
    s.add(issue)
    s.commit()
    print('Seed created: SC-EXAMPLE-0001')

if __name__ == '__main__':
    seed()
