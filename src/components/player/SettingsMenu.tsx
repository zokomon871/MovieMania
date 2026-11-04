import React, { useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Gauge, Maximize2, PictureInPicture2, Radio } from 'lucide-react';
import { QualityLevel } from '@/hooks/useLiveStream';

export type ObjectFit = 'contain' | 'cover' | 'fill';
export const FIT_ORDER: ObjectFit[] = ['contain', 'cover', 'fill'];
export const FIT_LABEL: Record<ObjectFit, string> = { contain: 'Fit', cover: 'Zoom', fill: 'Stretch' };
const FIT_HINT: Record<ObjectFit, string> = {
  contain: 'Whole picture, may show black bars',
  cover: 'Fill the screen, edges cropped',
  fill: 'Fill the screen, picture stretched',
};

export interface SettingsProps {
  qualityLevels: QualityLevel[];
  currentQuality: number;
  activeLabel?: string;
  objectFit: ObjectFit;
  sourceCount: number;
  currentSource: number;
  onSelectQuality: (index: number) => void;
  onSelectFit: (fit: ObjectFit) => void;
  onSelectSource: (index: number) => void;
  onTogglePip: () => void;
  onClose: () => void;
}

type View = 'main' | 'quality' | 'fit' | 'source';

export function SettingsMenu(props: SettingsProps) {
  const { qualityLevels, currentQuality, activeLabel, objectFit, sourceCount, currentSource } = props;
  const [view, setView] = useState<View>('main');
  const [pipSupported, setPipSupported] = useState(false);
  useEffect(() => setPipSupported(!!document.pictureInPictureEnabled), []);

  const qualityValue =
    currentQuality === -1
      ? `Auto${activeLabel ? ` · ${activeLabel}` : ''}`
      : qualityLevels.find((l) => l.index === currentQuality)?.label ?? 'Auto';

  const pick = (fn: () => void) => {
    fn();
    setView('main');
  };

  return (
    <div className="lp-menu" role="menu" onPointerUp={(e) => e.stopPropagation()}>
      {view === 'main' && (
        <>
          <Row icon={<Gauge size={17} />} label="Quality" value={qualityLevels.length ? qualityValue : 'Auto'} disabled={qualityLevels.length < 2} onClick={() => setView('quality')} />
          <Row icon={<Maximize2 size={17} />} label="Picture size" value={FIT_LABEL[objectFit]} onClick={() => setView('fit')} />
          {sourceCount > 1 && (
            <Row icon={<Radio size={17} />} label="Source" value={`${currentSource + 1} of ${sourceCount}`} onClick={() => setView('source')} />
          )}
          {pipSupported && (
            <button className="lp-menu-row" role="menuitem" onClick={() => { props.onTogglePip(); props.onClose(); }}>
              <span className="icon"><PictureInPicture2 size={17} /></span>
              <span className="label">Picture-in-picture</span>
            </button>
          )}
        </>
      )}

      {view === 'quality' && (
        <SubMenu title="Quality" onBack={() => setView('main')}>
          <Option selected={currentQuality === -1} label="Auto" hint={activeLabel ? `Now ${activeLabel}` : 'Adjusts to your connection'} onClick={() => pick(() => props.onSelectQuality(-1))} />
          {qualityLevels.map((lvl) => (
            <Option key={lvl.index} selected={currentQuality === lvl.index} label={lvl.label} tag={lvl.height >= 720 ? 'HD' : undefined} onClick={() => pick(() => props.onSelectQuality(lvl.index))} />
          ))}
        </SubMenu>
      )}

      {view === 'fit' && (
        <SubMenu title="Picture size" onBack={() => setView('main')}>
          {FIT_ORDER.map((fit) => (
            <Option key={fit} selected={objectFit === fit} label={FIT_LABEL[fit]} hint={FIT_HINT[fit]} onClick={() => pick(() => props.onSelectFit(fit))} />
          ))}
        </SubMenu>
      )}

      {view === 'source' && (
        <SubMenu title="Source" onBack={() => setView('main')}>
          {Array.from({ length: sourceCount }, (_, i) => (
            <Option key={i} selected={currentSource === i} label={`Source ${i + 1}`} hint={i === 0 ? 'Primary feed' : 'Backup feed'} onClick={() => pick(() => props.onSelectSource(i))} />
          ))}
        </SubMenu>
      )}
    </div>
  );
}

function Row({ icon, label, value, onClick, disabled }: { icon: React.ReactNode; label: string; value: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button className="lp-menu-row" role="menuitem" onClick={onClick} disabled={disabled}>
      <span className="icon">{icon}</span>
      <span className="label">{label}</span>
      <span className="value">{value}</span>
      {!disabled && <ChevronRight size={16} className="chev" />}
    </button>
  );
}

function SubMenu({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <>
      <button className="lp-menu-back" onClick={onBack}>
        <ChevronLeft size={16} /> {title}
      </button>
      <div className="lp-menu-options">{children}</div>
    </>
  );
}

function Option({ selected, label, hint, tag, onClick }: { selected: boolean; label: string; hint?: string; tag?: string; onClick: () => void }) {
  return (
    <button className={`lp-menu-option ${selected ? 'selected' : ''}`} role="menuitemradio" aria-checked={selected} onClick={onClick}>
      <span className="check">{selected && <Check size={15} />}</span>
      <span className="text">
        <span className="label">
          {label}
          {tag && <span className="tag">{tag}</span>}
        </span>
        {hint && <span className="hint">{hint}</span>}
      </span>
    </button>
  );
}
