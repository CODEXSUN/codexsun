CREATE TABLE IF NOT EXISTS sites_community_showcase (
  profile_id TEXT PRIMARY KEY,
  audience TEXT NOT NULL CHECK (audience IN ('students', 'alumni')),
  display_name_en TEXT NOT NULL,
  display_name_ta TEXT NOT NULL,
  focus_en TEXT NOT NULL,
  focus_ta TEXT NOT NULL,
  image_panel INTEGER NOT NULL CHECK (image_panel BETWEEN 0 AND 5),
  published INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL
);

INSERT OR IGNORE INTO sites_community_showcase
  (profile_id, audience, display_name_en, display_name_ta, focus_en, focus_ta, image_panel, sort_order)
VALUES
  ('sample-student-01', 'students', 'Nila', 'நிலா', 'Beginner staff practice', 'தொடக்கநிலை சிலம்பப் பயிற்சி', 0, 1),
  ('sample-student-02', 'students', 'Kavin', 'கவின்', 'Footwork and balance', 'காலடி முறையும் சமநிலையும்', 1, 2),
  ('sample-student-03', 'students', 'Yazhini', 'யாழினி', 'Group training', 'குழுப் பயிற்சி', 2, 3),
  ('sample-alumni-01', 'alumni', 'Arun', 'அருண்', 'Continuing the Silambam tradition', 'சிலம்ப மரபைத் தொடர்கிறார்', 3, 1),
  ('sample-alumni-02', 'alumni', 'Meena', 'மீனா', 'Sharing learned skills', 'கற்ற திறன்களைப் பகிர்கிறார்', 4, 2),
  ('sample-alumni-03', 'alumni', 'Saran', 'சரண்', 'Staying connected to training', 'பயிற்சியுடன் தொடர்பில் உள்ளார்', 5, 3);
