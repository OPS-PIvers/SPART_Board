import React, { useMemo } from 'react';
import * as Icons from 'lucide-react';
import { ArrowLeft, Trash2, Rocket, Grab } from 'lucide-react';
import { useDashboard } from '../../../context/useDashboard';
import { InstructionalRoutine } from '../../../config/instructionalRoutines';
import {
  WidgetData,
  InstructionalRoutinesConfig,
  WidgetType,
} from '../../../types';
import { BLOOMS_DATA } from '../../../config/bloomsData';

interface RoutineViewProps {
  widget: WidgetData;
  selectedRoutine: InstructionalRoutine;
}

export const RoutineView: React.FC<RoutineViewProps> = ({
  widget,
  selectedRoutine,
}) => {
  const { updateWidget, addWidget, clearAllStickers } = useDashboard();
  const config = widget.config as InstructionalRoutinesConfig;
  const { customSteps = [], scaleMultiplier = 1 } = config;

  // Mathematical Scaling
  const dynamicFontSize = useMemo(() => {
    // Routine view scaling: Estimate total vertical "ems" to fit without scrolling
    // Padding (3em) + Header area (~4.5em)
    let totalVerticalEms = 7.5;

    // Bloom's specific buttons (~4em)
    if (selectedRoutine.id === 'blooms-analysis') {
      totalVerticalEms += 4;
    }

    // Steps: each step is roughly 3.5em including its gap (1.5em)
    // We use a slightly more conservative estimate to ensure it fits
    const stepCount = customSteps.length || 1;
    totalVerticalEms += stepCount * 4.2;

    const heightFactor = widget.h / totalVerticalEms;
    const widthFactor = widget.w / 22; // Estimate horizontal capacity

    const baseSize = Math.min(widthFactor, heightFactor);
    return Math.max(8, baseSize * scaleMultiplier);
  }, [
    widget.w,
    widget.h,
    scaleMultiplier,
    selectedRoutine.id,
    customSteps.length,
  ]);

  const onDragStart = (
    e: React.DragEvent,
    icon: string,
    color: string,
    label?: string
  ) => {
    e.dataTransfer.setData(
      'application/spart-sticker',
      JSON.stringify({ icon, color, label })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  const launchBloomsResource = (type: 'keyWords' | 'questionStarters') => {
    const title =
      type === 'keyWords' ? "Bloom's Key Words" : "Bloom's Sentence Starters";

    let content = `<h3 style="font-weight: 900; margin-bottom: 0.5em; text-transform: uppercase; color: #1e293b;">${title}</h3>`;

    if (type === 'keyWords') {
      BLOOMS_DATA.keyWords.forEach((levelGroup) => {
        content += `<h4 style="font-weight: 800; margin-top: 1em; margin-bottom: 0.25em; color: #2d3f89; font-size: 0.9em;">${levelGroup.level}</h4><ul style="padding-left: 1.2em; list-style-type: disc; color: #475569; font-size: 0.85em;">`;
        levelGroup.words.forEach((item) => {
          content += `<li>${item}</li>`;
        });
        content += `</ul>`;
      });
    } else {
      BLOOMS_DATA.questionStarters.forEach((levelGroup) => {
        content += `<h4 style="font-weight: 800; margin-top: 1em; margin-bottom: 0.25em; color: #2d3f89; font-size: 0.9em;">${levelGroup.level}</h4><ul style="padding-left: 1.2em; list-style-type: disc; color: #475569; font-size: 0.85em;">`;
        levelGroup.starters.forEach((item) => {
          content += `<li>${item}</li>`;
        });
        content += `</ul>`;
      });
    }

    addWidget('text', {
      config: {
        content,
        bgColor: '#ffffff',
        fontSize: 16,
      },
    });
  };

  const RoutineIcon =
    (Icons as unknown as Record<string, React.ElementType>)[
      selectedRoutine.icon
    ] ?? Icons.HelpCircle;

  return (
    <div
      className="flex flex-col h-full bg-white animate-in fade-in duration-200 overflow-hidden relative"
      style={{
        fontSize: `${dynamicFontSize}px`,
        padding: '1.5em',
      }}
    >
      <div
        className="flex items-center shrink-0 border-b border-brand-blue-lighter"
        style={{ gap: '1em', marginBottom: '1.5em', paddingBottom: '1em' }}
      >
        <button
          onClick={() =>
            updateWidget(widget.id, {
              config: { ...config, selectedRoutineId: null },
            })
          }
          className="rounded-full transition-colors hover:bg-slate-100"
          style={{ padding: '0.5em' }}
          title="Back to Library"
        >
          <ArrowLeft size={dynamicFontSize * 1.5} className="text-slate-600" />
        </button>
        <div className="flex-1">
          <h2
            className="text-brand-blue-primary leading-tight font-bold"
            style={{ fontSize: '1.4em' }}
          >
            {selectedRoutine.name}
          </h2>
          <span
            className="text-brand-blue-light uppercase tracking-widest block mt-[0.2em]"
            style={{ fontSize: '0.6em' }}
          >
            {selectedRoutine.grades} Protocol
          </span>
        </div>
        <button
          onClick={clearAllStickers}
          className="bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center"
          style={{ padding: '0.6em' }}
          title="Clear all stickers from board"
        >
          <Trash2 size={dynamicFontSize * 1.25} />
        </button>
        <div
          className="bg-brand-blue-lighter text-brand-red-primary rounded-3xl shadow-sm flex items-center justify-center"
          style={{ padding: '1em' }}
        >
          <RoutineIcon style={{ width: '2em', height: '2em' }} />
        </div>
      </div>

      {selectedRoutine.id === 'blooms-analysis' && (
        <div
          className="flex shrink-0 px-1"
          style={{ gap: '1em', marginBottom: '1em' }}
        >
          <button
            onClick={() => launchBloomsResource('keyWords')}
            className="flex-1 bg-brand-blue-lighter/50 text-brand-blue-primary rounded-xl font-black uppercase tracking-wider hover:bg-brand-blue-lighter transition-colors border border-brand-blue-lighter flex items-center justify-center"
            style={{ padding: '1em', gap: '0.5em', fontSize: '0.7em' }}
          >
            <Icons.Key size={dynamicFontSize * 1.2} /> Key Words
          </button>
          <button
            onClick={() => launchBloomsResource('questionStarters')}
            className="flex-1 bg-brand-blue-lighter/50 text-brand-blue-primary rounded-xl font-black uppercase tracking-wider hover:bg-brand-blue-lighter transition-colors border border-brand-blue-lighter flex items-center justify-center"
            style={{ padding: '1em', gap: '0.5em', fontSize: '0.7em' }}
          >
            <Icons.MessageSquare size={dynamicFontSize * 1.2} /> Sentence
            Starters
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <ul className="flex flex-col" style={{ gap: '1.5em' }}>
          {customSteps.map((step, i) => {
            const StepIcon = step.icon
              ? (Icons as unknown as Record<string, React.ElementType>)[
                  step.icon
                ]
              : null;
            return (
              <li
                key={step.id}
                className="flex items-start animate-in slide-in-from-left duration-300 group"
                style={{ gap: '1em' }}
              >
                <span
                  className="bg-brand-blue-primary text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                  style={{
                    width: '2.5em',
                    height: '2.5em',
                    fontSize: '0.8em',
                  }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 flex flex-col" style={{ gap: '0.5em' }}>
                  <div
                    className="flex items-start justify-between"
                    style={{ gap: '1em' }}
                  >
                    <p
                      className="font-bold text-brand-gray-darkest leading-relaxed pt-1"
                      style={{ fontSize: '1em' }}
                    >
                      {step.text}
                    </p>

                    {StepIcon && step.icon && (
                      <div
                        draggable
                        onDragStart={(e) =>
                          onDragStart(
                            e,
                            step.icon as string,
                            step.color ?? 'blue',
                            step.label
                          )
                        }
                        className={`rounded-xl bg-white border-2 border-${step.color ?? 'blue'}-100 shadow-sm cursor-grab active:cursor-grabbing hover:scale-110 hover:-rotate-3 transition-all shrink-0 flex flex-col items-center group/sticker`}
                        style={{ padding: '0.5em', gap: '0.25em' }}
                        title="Drag to whiteboard"
                      >
                        <div
                          className={`rounded-lg bg-${step.color ?? 'blue'}-50 text-${step.color ?? 'blue'}-600`}
                          style={{ padding: '0.4em' }}
                        >
                          <StepIcon
                            size={dynamicFontSize * 1.5}
                            strokeWidth={2.5}
                          />
                        </div>
                        {step.label && (
                          <span
                            className="font-black uppercase text-slate-500 text-center leading-none"
                            style={{ fontSize: '0.5em' }}
                          >
                            {step.label}
                          </span>
                        )}
                        <div
                          className="flex items-center opacity-0 group-hover/sticker:opacity-100 transition-opacity"
                          style={{ gap: '0.1em' }}
                        >
                          <Grab
                            size={dynamicFontSize * 0.5}
                            className="text-slate-300"
                          />
                          <span
                            className="font-black uppercase text-slate-400"
                            style={{ fontSize: '0.4em' }}
                          >
                            Drag
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  {step.attachedWidget && (
                    <button
                      onClick={() =>
                        addWidget(step.attachedWidget?.type as WidgetType, {
                          config: step.attachedWidget?.config,
                        })
                      }
                      className="self-start bg-brand-blue-light/10 text-brand-blue-primary rounded-lg font-black uppercase tracking-wider flex items-center hover:bg-brand-blue-light/20 transition-colors"
                      style={{
                        padding: '0.5em 1em',
                        gap: '0.5em',
                        fontSize: '0.8em',
                      }}
                    >
                      <Rocket size={dynamicFontSize} />
                      Launch {step.attachedWidget.label}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
