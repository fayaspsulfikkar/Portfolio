import React from 'react';
import { GitHubCalendar } from 'react-github-calendar';
import { Github, Download } from 'lucide-react';

const GitHubProfile = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: '12px 16px',
        width: '100%',
      }}
      className="lg:flex-row lg:items-center"
    >
      {/* Left: Avatar + links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div
          style={{
            borderRadius: 10,
            border: '1px solid rgba(192,57,43,0.3)',
            padding: 2,
            background: 'rgba(192,57,43,0.06)',
          }}
        >
          <img
            src="https://github.com/fayaspsulfikkar.png"
            onError={(e) => { e.currentTarget.src = '/fayas.png'; }}
            alt="fayaspsulfikkar"
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>

        <div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(192,57,43,0.7)',
              marginBottom: 4,
            }}
          >
            @fayaspsulfikkar
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <a
              href="https://github.com/fayaspsulfikkar"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 7,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                transition: 'all 0.2s ease',
                color: 'rgba(240,236,232,0.6)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(192,57,43,0.4)';
                e.currentTarget.style.background = 'rgba(192,57,43,0.08)';
                e.currentTarget.style.color = 'rgba(240,236,232,0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.color = 'rgba(240,236,232,0.6)';
              }}
              title="GitHub Profile"
            >
              <Github size={13} />
            </a>
            <a
              href="/resume.pdf"
              download
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 7,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                transition: 'all 0.2s ease',
                color: 'rgba(240,236,232,0.6)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(192,57,43,0.4)';
                e.currentTarget.style.background = 'rgba(192,57,43,0.08)';
                e.currentTarget.style.color = 'rgba(240,236,232,0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.color = 'rgba(240,236,232,0.6)';
              }}
              title="Download Resume"
            >
              <Download size={13} />
            </a>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: 1,
          alignSelf: 'stretch',
          background: 'rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
        className="hidden lg:block"
      />

      {/* Right: GitHub calendar */}
      <div
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
        }}
        className="custom-scrollbar"
      >
        <div style={{ transform: 'scale(0.76)', transformOrigin: 'left center', margin: '-8px 0 -8px 0' }}>
          <GitHubCalendar
            username="fayaspsulfikkar"
            year={2026}
            colorScheme="dark"
            hideTotalCount={false}
            hideColorLegend={true}
            blockSize={10}
            blockMargin={3}
            fontSize={11}
            theme={{
              dark: ['#1a1a1a', '#3d1a17', '#7a2820', '#c0392b', '#e74c3c'],
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default GitHubProfile;
