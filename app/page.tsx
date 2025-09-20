'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import "./globals.css";

interface ProjectConfig {
  language: 'typescript' | 'javascript';
  useTailwind: boolean;
  useEmotion: boolean;
  uiLibrary: 'shadcn' | 'mantine' | 'none';
  validation: 'zod' | 'yup' | 'none';
  stateManagement: 'zustand' | 'redux' | 'none';
  database: 'prisma' | 'drizzle' | 'none';
  authentication: 'nextauth' | 'clerk' | 'none';
  testing: 'jest' | 'vitest' | 'none';
  includeLoginPage: boolean;
}

export default function Home() {
  const [provider, setProvider] = useState<'github' | 'gitlab'>('github');
  const [projectName, setProjectName] = useState('');
  const [namespace, setNamespace] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<ProjectConfig>({
    language: 'typescript',
    useTailwind: true,
    useEmotion: false,
    uiLibrary: 'shadcn',
    validation: 'zod',
    stateManagement: 'zustand',
    database: 'none',
    authentication: 'none',
    testing: 'jest',
    includeLoginPage: false
  });


  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
      setCurrentStep(1);
      // Ensure body scrolling is restored when modal closes
      document.body.style.overflow = 'unset';
    }, 300);
  };


  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scrolling when modal is closed
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // Always restore scrolling on cleanup
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }
    
    setLoading(true);

    // Show loading toast
    const loadingToastId = toast.loading(
      `Creating repository "${projectName}"... This may take a few seconds.`,
      { duration: 0 } // Persist until we dismiss it
    );

    try {
      const res = await fetch('/api/boilerplate-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provider, 
          projectName, 
          namespace, 
          visibility,
          config 
        }),
      });

      const data = await res.json();
      
      // Dismiss loading toast
      toast.dismiss(loadingToastId);
      
      if (!res.ok) {
        const errorMessage = data.message || `Request failed with status ${res.status}`;
        toast.error(`Failed to create repository: ${errorMessage}`, {
          duration: 6000,
        });
        
        // Show additional error details if available
        if (data.error && data.error !== data.message) {
          toast.error(`Additional details: ${data.error}`, {
            duration: 8000,
          });
        }
      } else {
        // Success toast
        toast.success(
          `🎉 Repository "${projectName}" created successfully! Opening in new tab...`,
          {
            duration: 5000,
          }
        );
        
        // Close modal and reset form
        closeModal();
        setProjectName('');
        setNamespace('');
        
        // Open repository in new tab
        setTimeout(() => {
          if (data.webUrl) {
            // Use both methods to ensure cross-browser compatibility
            const newWindow = window.open(data.webUrl, '_blank', 'noopener,noreferrer');
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
              // Fallback: If popup is blocked, show a toast with the URL
              toast.success(
                `🚨 Popup blocked! Repository created at: ${data.webUrl}`,
                {
                  duration: 10000,
                }
              );
              // Also copy URL to clipboard
              if (navigator.clipboard) {
                navigator.clipboard.writeText(data.webUrl);
                toast.success('📋 Repository URL copied to clipboard!', {
                  duration: 3000,
                });
              }
            }
          }
        }, 500); // Small delay to show the success toast
      }
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToastId);
      
      // Handle network errors
      toast.error(
        `Network error: Failed to connect to the server. Please check your internet connection and try again.`,
        {
          duration: 8000,
        }
      );
      
      console.error('Network error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (

    <div className="">
    <div className="relative bg-black-6">
      <div className=" bg-[url('/assets/svg/Noise.svg')] bg-blend-darken bg-repeat bg-opacity-[5%]">
        <div className="sm:p-[48px] p-[24px]">
          <div className="bg-[url('/assets/svg/Noise.svg')] bg-opacity-[3%] relative bg-repeat rounded-[38px]">
            <div className="absolute w-[160px] h-[160px] left-[32px] top-[2px] bg-[#bcbdd9] rounded-full " />
            <div className="glass border-2 border-solid border-transparent pb-[80px] bg-blend-luminosity w-full rounded-[38px] shadow-lg">
              <div className="3xl:max-w-[1400px] 3xl:mx-auto px-[50px]">
                <header className="flex justify-between items-center py-[33.92px] px-12 gradient-border-4">

                    <Link href="/">
                      <Image
                        src="/assets/svg/Logo.png"
                        className="w-[140px] h-[24.16px]"
                        alt="Felixin logo"
                        width={140}
                        height={24.16}
                      />
                    </Link>
                    <div className="header-menu-bg rounded-xl gap-8 py-[13px] px-[20px] flex">
                      <div className="flex items-center gap-2.5">

                        <div className='flex items-center gap-[8px]'>
                        <Image
                          src="/assets/svg/box.svg"
                          className="w-[16px] h-[16px]"
                          alt=""
                          width={16}
                          height={16}
                        />
                        <h1 className="font-lecturis font-bold text-[15px] text-white-base leading-5">
                          Tools ⌁ boilerplate-nextjs
                        </h1>
                        </div>
                      </div>
                      <span className="font-lecturis font-bold text-[13px] text-gray-1 leading-5">
                        v1.beta
                      </span>
                    </div>

                  <div className="">

                    <div className="flex items-center justify-center rounded-xl w-[40px] h-[40px] bg-blue-2 rounded-full glass ">
                      <Image
                        src="/assets/svg/github.svg"
                        className="w-[12px] h-[13.33px]"
                        alt="github logo"
                        width={12}
                        height={13.33}
                      />
                    </div>
                  </div>
                </header>

                <div className="flex flex-col">
                  <div className="mdl:px-[92px] sm:px-[54px] px-4 flex mlap:flex-row flex-col justify-between items-center">
                    <div className="relative md:w-[545px] w-fit mt-[32px]">
                      <div className="max-w-[336px] gradient-border-5 ">
                        <div className="flex items-center justify-between px-4 mb-4 pt-6">
                          <span className="gradient-opacity font-dogica opacity-70 font-normal text-[12px] text-gray-1 leading-4">
                            Aug
                          </span>
                          <span className="font-dogica opacity-70 font-normal text-[12px] text-gray-1 leading-4">
                            Sep
                          </span>
                          <span className="gradient-opacity font-dogica opacity-70 font-normal text-[12px] text-gray-1 leading-4">
                            Oct
                          </span>
                        </div>
                        <Image
                          src="/assets/svg/dot-with-line.svg"
                          alt="dot images"
                          className="w-[336px] h-[280px]"
                          width={336}
                          height={280}
                        />
                      </div>
                      <div className='absolute top-[5rem] flex items-center px-[4px]'>
                        <div className=" w-max">
                          <div className="flex flex-col items-end">
                            <div className="flex gap-[19px] items-center">
                              <div className="rounded-full border-[1.5px] border-gray-3 p-[2px]">
                                <div className="tick-box w-[28px] h-[28px] flex items-center justify-center rounded-full">
                                  <Image
                                    src="/assets/svg/tick.svg"
                                    alt="tick"
                                    className="w-[12px] h-[12px]"
                                    width={12}
                                    height={12}
                                  />
                                </div>
                              </div>
                              <span className="font-lecturis font-bold mdl:text-[40px] mlap:text-[32px] md:text-[40px] text-[18px] text-white-1 leading-[48px]">
                                Congratulations! You did it.{" "}
                              </span>
                            </div>
                            <p className="font-lecturis pt-[15px] w-fit font-light mdl:text-[20px] mlap:text-[16px] md:text-[20px] text-[10px] text-white-1 leading-[28px]">
                              You&apos;ve successfully created a project with
                              <span className="font-lecturis font-bold md:text-[20px] text-[12px] text-white-2 leading-[28px]">
                                {" "}
                                nestjs + npm.
                              </span>
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>
                    <div className="flex items-center mt-[32px] mlap:right-0">
                      <div className="doc-box max-w-[394px] py-8 rounded-[12px]">
                        <div className="">
                          <div className="px-[28px]">
                            <h2 className="text-[20px] mb-[17.8px] font-lecturis font-bold leading-[14px] text-white-base">
                              Documentation
                            </h2>
                                                            <p className="text-[16px] sm:max-w-[340px] w-[300px] font-lecturis font-normal leading-[26px] text-white-base">
  Kickstart your projects with a <span className="text-blue-3">custom boilerplate</span> powered by Next.js, Radix UI, and Tailwind CSS.
  Save time with pre-built, reusable components and automated GitHub/GitLab setup—so you can focus on building, not configuring.
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                  <div className="flex flex-col items-center mt-[4rem] sm:mt-[-5rem]">
                    <button
                      className='action-button cursor-pointer'
                      onClick={() => setIsModalOpen(true)}
                    >
                    <Image
                      src="/assets/svg/File.svg"
                      className="w-[364px] h-[334px]"
                      alt="File image"
                      width={364}
                      height={334}
                        />
                    </button>
                    <div className="-mt-[6.5rem] gap-[6px] flex flex-col items-center">
                      <h3 className="m-[0px] font-lecturis font-normal text-[20px] text-white-1 text-center">
                        Welcome to Your New{" "}
                        <span className="font-bold">NextJs</span> Boilerplate!
                      </h3>
                      <div className="flex flex-col items-center gap-[6px]">
                        <p className="m-[0px] font-lecturis font-normal text-[16px] text-center text-white-10">
                          Your Boilerplate template is up and running.
                        </p>
                        <p className="m-[0px] font-lecturis font-normal text-[16px] text-center text-white-10">
                          Please delete this sample file and create your own files
                          to get started.
                        </p>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className={`fixed inset-0 bg-black-5 backdrop-blur-12 flex items-center justify-center z-50 ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
          onClick={closeModal}
          onWheel={(e) => e.stopPropagation()} // Prevent wheel events from bubbling
          role='dialog'
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflowY: 'auto' // Allow backdrop to handle overflow
          }}
        >
          <div
            className={`glass px-[12px] pb-[24px] border-2 border-solid border-transparent bg-background-1 rounded-[12px] p-6 max-w-lg w-full mx-4 ${isClosing ? 'animate-scaleOut' : 'animate-scaleIn'}`}
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => {
              // Allow scrolling within modal but prevent it from bubbling to backdrop
              e.stopPropagation();
            }}
            style={{
              maxWidth: '32rem',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              overflowX: 'hidden',
              margin: '20px 0' // Add margin for better spacing when scrolling
            }}
          >
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-[16px]"
            >
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-xl font-lecturis font-bold text-white-base">
                  🚀 {currentStep === 1 ? 'Create New Project' : 'Configure Your Stack'}
                </h1>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-gray-1 action-button hover:text-white-base text-[24px] font-bold "
                >
                  ×
                </button>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center justify-between mb-4">
                
                <span className="text-sm text-gray-1 font-lecturis">
                  Step {currentStep} of 2
                </span>
              </div>

              {currentStep === 1 ? (
                <>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as 'github' | 'gitlab')}
                    className="h-[48px] rounded-[12px] px-[12px] p-3 bg-black-2 border border-gray-3 rounded-lg text-white-base font-lecturis focus:outline-none focus:ring-2 focus:ring-blue-1"
                  >
                    <option className='text-black-base' value="github">GitHub</option>
                    <option className='text-black-base' value="gitlab">GitLab</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Project name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="h-[48px] rounded-[12px] px-[12px] bg-black-2 border border-gray-3 rounded-lg text-white-base font-lecturis placeholder:text-gray-1 focus:outline-none focus:ring-2 focus:ring-blue-1"
                    required
                  />

                  <input
                    type="text"
                    placeholder={provider === 'github' ? 'Org/User name' : 'Namespace ID'}
                    value={namespace}
                    onChange={(e) => setNamespace(e.target.value)}
                    className="h-[48px] rounded-[12px] px-[12px] p-3 bg-black-2 border border-gray-3 rounded-lg text-white-base font-lecturis placeholder:text-gray-1 focus:outline-none focus:ring-2 focus:ring-blue-1"
                    required
                  />

                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="h-[48px] rounded-[12px] px-[12px] p-3 bg-black-2 border border-gray-3 rounded-lg text-white-base font-lecturis focus:outline-none focus:ring-2 focus:ring-blue-1"
                  >
                    <option className='text-black-base' value="private">Private</option>
                    <option className='text-black-base' value="public">Public</option>
                    {provider === 'gitlab' && <option className='text-black-base' value="internal">Internal</option>}
                  </select>
                </>
              ) : (
                <>
                  {/* Configuration Step */}
                  <div className="flex flex-col items-center gap-[24px] w-full">
                    <div className='w-full'>
                      <label className="block text-sm font-medium text-white-base mb-2 font-lecturis mb-[6px]">Language</label>
                      <select
                        value={config.language}
                        onChange={(e) => setConfig({...config, language: e.target.value as 'typescript' | 'javascript'})}
                        className="w-full h-[48px] rounded-[12px] px-[12px] bg-black-2 border border-gray-3 text-white-base font-lecturis focus:outline-none focus:ring-2 focus:ring-blue-1"
                      >
                        <option className='text-black-base' value="typescript">TypeScript</option>
                        <option className='text-black-base' value="javascript">JavaScript</option>
                      </select>
                    </div>

                    <div className='w-full'>
                      <label className="block text-sm font-medium text-white-base mb-3 font-lecturis mb-[6px]">Styling</label>
                      <div className="w-full flex justify-start gap-[32px] items-center">
                        <label className="flex items-center gap-[8px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.useTailwind}
                            onChange={(e) => setConfig({...config, useTailwind: e.target.checked})}
                            className="w-4 h-4 !m-[0px] text-blue-1 bg-black-2 border-gray-3 rounded focus:ring-blue-1 focus:ring-2"
                          />
                          <span className="text-white-base font-lecturis text-sm">Tailwind CSS</span>
                        </label>
                        <label className="flex items-center gap-[8px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.useEmotion}
                            onChange={(e) => setConfig({...config, useEmotion: e.target.checked})}
                            className="w-4 h-4 !m-[0px] text-blue-1 bg-black-2 border-gray-3 rounded focus:ring-blue-1 focus:ring-2"
                          />
                          <span className="text-white-base font-lecturis text-sm">Emotion</span>
                        </label>
                      </div>
                      {(config.useTailwind && config.useEmotion) && (
                        <p className="text-xs text-[#fff] mt-[8px] mb-[0px] font-lecturis">
                          💡 Both styling libraries selected - you can use them together!
                        </p>
                      )}
                      {(!config.useTailwind && !config.useEmotion) && (
                        <p className="text-xs text-[#fff] mt-[8px] mb-[0px] font-lecturis">
                          ⚠️ No styling library selected - using plain CSS
                        </p>
                      )}
                    </div>

                    <div className='w-full'>
                      <label className="block text-sm font-medium text-white-base mb-2 font-lecturis mb-[6px]">UI Library</label>
                      <select
                        value={config.uiLibrary}
                        onChange={(e) => setConfig({...config, uiLibrary: e.target.value as 'shadcn' | 'mantine' | 'none'})}
                        className="w-full h-[48px] rounded-[12px] px-[12px] bg-black-2 border border-gray-3 text-white-base font-lecturis focus:outline-none focus:ring-2 focus:ring-blue-1"
                      >
                        <option className='text-black-base' value="shadcn">ShadCN UI</option>
                        <option className='text-black-base' value="mantine">Mantine</option>
                        <option className='text-black-base' value="none">None</option>
                      </select>
                    </div>

                    <div className='w-full'>
                      <label className="block text-sm font-medium text-white-base mb-2 font-lecturis mb-[6px]">Validation</label>
                      <select
                        value={config.validation}
                        onChange={(e) => setConfig({...config, validation: e.target.value as 'zod' | 'yup' | 'none'})}
                        className="w-full h-[48px] rounded-[12px] px-[12px] bg-black-2 border border-gray-3 text-white-base font-lecturis focus:outline-none focus:ring-2 focus:ring-blue-1"
                      >
                        <option className='text-black-base' value="zod">Zod</option>
                        <option className='text-black-base' value="yup">Yup</option>
                        <option className='text-black-base' value="none">None</option>
                      </select>
                    </div>

                    <div className='w-full'>
                      <label className="block text-sm font-medium text-white-base mb-2 font-lecturis mb-[6px]">State Management</label>
                      <select
                        value={config.stateManagement}
                        onChange={(e) => setConfig({...config, stateManagement: e.target.value as 'zustand' | 'redux' | 'none'})}
                        className="w-full h-[48px] rounded-[12px] px-[12px] bg-black-2 border border-gray-3 text-white-base font-lecturis focus:outline-none focus:ring-2 focus:ring-blue-1"
                      >
                        <option className='text-black-base' value="zustand">Zustand</option>
                        <option className='text-black-base' value="redux">Redux Toolkit</option>
                        <option className='text-black-base' value="none">None</option>
                      </select>
                    </div>

                    <div className='w-full'>
                      <label className="block text-sm font-medium text-white-base mb-2 font-lecturis mb-[6px]">Database</label>
                      <select
                        value={config.database}
                        onChange={(e) => setConfig({...config, database: e.target.value as 'prisma' | 'drizzle' | 'none'})}
                        className="w-full h-[48px] rounded-[12px] px-[12px] bg-black-2 border border-gray-3 text-white-base font-lecturis focus:outline-none focus:ring-2 focus:ring-blue-1"
                      >
                        <option className='text-black-base' value="prisma">Prisma</option>
                        <option className='text-black-base' value="drizzle">Drizzle</option>
                        <option className='text-black-base' value="none">None</option>
                      </select>
                    </div>

                    <div className='w-full'>
                      <label className="block text-sm font-medium text-white-base mb-2 font-lecturis mb-[6px]">Authentication</label>
                      <select
                        value={config.authentication}
                        onChange={(e) => setConfig({...config, authentication: e.target.value as 'nextauth' | 'clerk' | 'none'})}
                        className="w-full h-[48px] rounded-[12px] px-[12px] bg-black-2 border border-gray-3 text-white-base font-lecturis focus:outline-none focus:ring-2 focus:ring-blue-1"
                      >
                        <option className='text-black-base' value="nextauth">NextAuth.js</option>
                        <option className='text-black-base' value="clerk">Clerk</option>
                        <option className='text-black-base' value="none">None</option>
                      </select>
                    </div>

                    <div className='w-full'>
                      <label className="block text-sm font-medium text-white-base mb-2 font-lecturis mb-[6px]">Testing</label>
                      <select
                        value={config.testing}
                        onChange={(e) => setConfig({...config, testing: e.target.value as 'jest' | 'vitest' | 'none'})}
                        className="w-full h-[48px] rounded-[12px] px-[12px] bg-black-2 border border-gray-3 text-white-base font-lecturis focus:outline-none focus:ring-2 focus:ring-blue-1"
                      >
                        <option className='text-black-base' value="jest">Jest</option>
                        <option className='text-black-base' value="vitest">Vitest</option>
                        <option className='text-black-base' value="none">None</option>
                      </select>
                    </div>

                    <div className='w-full' >
                      <label className="block text-sm font-medium text-white-base mb-3 font-lecturis mb-[6px]">Include Login Page</label>
                      <div className="flex gap-[32px]">
                        <label className="flex items-center gap-[8px] cursor-pointer">
                          <input
                            type="radio"
                            name="includeLoginPage"
                            checked={config.includeLoginPage === true}
                            onChange={() => setConfig({...config, includeLoginPage: true})}
                            className="w-[16px] h-[16px] text-blue-1 bg-black-2 border-gray-3 focus:ring-blue-1 focus:ring-2"
                          />
                          <span className="text-white-base font-lecturis text-sm">Yes</span>
                        </label>
                        <label className="flex items-center gap-[8px] cursor-pointer">
                          <input
                            type="radio"
                            name="includeLoginPage"
                            checked={config.includeLoginPage === false}
                            onChange={() => setConfig({...config, includeLoginPage: false})}
                            className="w-[16px] h-[16px] text-blue-1 bg-black-2 border-gray-3 focus:ring-blue-1 focus:ring-2"
                          />
                          <span className="text-white-base font-lecturis text-sm">No</span>
                        </label>
                      </div>
                      {config.includeLoginPage && (
                        <p className="text-xs text-gray-1 mt-[8px] mb-[0px] font-lecturis">
                          ✨ Will generate login page with {config.stateManagement !== 'none' ? config.stateManagement : 'built-in'} state management
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="h-[48px] flex gap-[16px] mt-4">
                {currentStep === 2 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="rounded-[12px] flex-1 p-3 bg-black-2 border border-gray-3 text-gray-1 rounded-lg font-lecturis hover:bg-black-1 focus:outline-none focus:ring-2 focus:ring-gray-1"
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-[12px] flex-1 p-3 bg-black-2 border border-gray-3 text-gray-1 rounded-lg font-lecturis hover:bg-black-1 focus:outline-none focus:ring-2 focus:ring-gray-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-[12px] outline-none border-none flex-1 p-3 bg-blue-1 text-white-base rounded-lg font-lecturis disabled:opacity-50 disabled:cursor-not-allowed "
                >
                  {loading ? 'Creating…' : currentStep === 1 ? 'Next' : 'Create Repository'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
  </div>
  );
}
