import React from 'react';
import { GitHubCalendar } from 'react-github-calendar';
import { Github, Download, User } from 'lucide-react';

const GitHubProfile = () => {
  return (
    <div
      className="relative max-w-none flex-grow overflow-hidden flex flex-col lg:flex-row items-center justify-between p-4 lg:px-8 lg:py-6"
      style={{ width: '100%', minWidth: '100%' }}
    >

      {/* Left: Info Section */}
      <div className="relative z-10 flex shrink-0 flex-col items-center lg:items-start lg:pr-6">
        {/* Avatar */}
        <div className="mb-3 rounded-2xl border border-white/80 bg-white/70 p-1.5 shadow-sm backdrop-blur-md">
          <img
            src="https://github.com/fayaspsulfikkar.png"
            alt="fayaspsulfikkar"
            className="h-16 w-16 rounded-xl object-cover sm:h-20 sm:w-20"
          />
        </div>

        {/* Connect */}
        <div className="flex flex-col items-center lg:items-start">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <User size={14} />
            Connect with me
          </div>

          <div className="flex gap-3">
            <a
              href="https://github.com/fayaspsulfikkar"
              target="_blank"
              rel="noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-slate-300/80 bg-white/50 transition-all hover:scale-105 hover:bg-white hover:shadow-sm"
            >
              <Github size={16} className="text-slate-700" />
            </a>
            <a
              href="/resume.pdf"
              download
              className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-slate-300/80 bg-white/50 transition-all hover:scale-105 hover:bg-white hover:shadow-sm"
            >
              <Download size={16} className="text-slate-700" />
            </a>
          </div>
        </div>
      </div>

      {/* Right: Calendar Section */}
      <div className="relative z-10 mt-6 lg:mt-0 flex w-full flex-1 justify-center lg:justify-end overflow-hidden">
        <div className="overflow-x-auto pb-4 custom-scrollbar lg:scale-[0.85] xl:scale-[0.95] transform origin-right">
          <GitHubCalendar
            username="fayaspsulfikkar"
            year={2026}
            colorScheme="light"
            hideTotalCount={false}
            hideColorLegend={true}
            theme={{
              light: ['#d1f1ceff', '#a4e295ff', '#75d97dff', '#40c051ff', '#07a31cff']
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default GitHubProfile;
