import RobotScene from './RobotScene';

/** Split layout shared by Login and Register. */
const AuthShell = ({ eyebrow, title, subtitle, children }) => (
  <div className="grid min-h-[75vh] items-center gap-10 lg:grid-cols-2">
    <div className="hidden lg:block">
      <p className="eyebrow mb-3">CarryBot team space</p>
      <h2 className="max-w-md font-display text-4xl font-bold leading-tight">
        Build the robot that <span className="gradient-text">follows you</span>.
      </h2>
      <div className="card mt-8 max-w-md overflow-hidden p-2">
        <RobotScene className="h-auto w-full" />
      </div>
    </div>
    <div className="mx-auto w-full max-w-md animate-fade-up">
      <div className="card p-8 sm:p-9">
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>}
        <div className="mt-7">{children}</div>
      </div>
    </div>
  </div>
);

export default AuthShell;
