'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X, SwitchCamera } from 'lucide-react';

interface QrScannerProps {
  onScan: (cardId: string) => void;
  onClose: () => void;
}

export function QrScanner({ onScan, onClose }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);
  const hasProcessedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

  // Function to properly stop and clear scanner
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = await scannerRef.current.getState();
        console.log('Stopping scanner, current state:', state);
        
        // State 2 = SCANNING, State 3 = PAUSED
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
          console.log('✅ Scanner stopped');
        }
        
        // Clear the scanner instance
        await scannerRef.current.clear();
        console.log('✅ Scanner cleared');
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }

    // Clear the QR reader element
    const qrReaderElement = document.getElementById('qr-reader');
    if (qrReaderElement) {
      qrReaderElement.innerHTML = '';
    }
  };

  // Function to start scanner
  const startScanner = async () => {
    try {
      setError(null);
      
      // Only stop if scanner already exists
      if (scannerRef.current) {
        await stopScanner();
        // Small delay to ensure cleanup is complete
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (!isMountedRef.current) return;

      console.log('Starting scanner with camera:', facingMode);

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: facingMode },
        {
          fps: 10,
          qrbox: function(viewfinderWidth, viewfinderHeight) {
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdgeSize * 0.7);
            console.log('QR Box Size:', qrboxSize);
            return { width: qrboxSize, height: qrboxSize };
          },
          aspectRatio: 1.0,
        },
        // Success callback
        (decodedText) => {
          // Once a QR has been processed, ignore all further detections
          if (hasProcessedRef.current) return;

          console.log('📸 QR Code detected:', decodedText);
          hasProcessedRef.current = true;

          // Play beep sound
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 1200;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
          } catch (audioErr) {
            console.error('Audio error:', audioErr);
          }

          // Show success state
          setScanSuccess(true);

          // Call parent callback
          onScan(decodedText);

          // Automatically close scanner after successful scan
          setTimeout(() => {
            if (isMountedRef.current) {
              handleClose();
            }
          }, 500);
        },
        // Error callback (this fires continuously when no QR is found - that's normal)
        undefined
      );

      // Apply custom styles
      const existingStyle = document.getElementById('qr-scanner-custom-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      const styleElement = document.createElement('style');
      styleElement.id = 'qr-scanner-custom-styles';
      styleElement.textContent = `
        #qr-reader {
          position: relative !important;
          width: 100% !important;
          height: 100% !important;
          min-height: 200px !important;
        }
        #qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
        }
        #qr-reader__dashboard_section {
          display: none !important;
        }
        #qr-reader__camera_selection {
          display: none !important;
        }
        #qr-reader canvas {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
        }
        @media (max-width: 640px) {
          #qr-reader {
            min-height: 250px !important;
          }
        }
        @media (min-width: 641px) {
          #qr-reader {
            min-height: 300px !important;
          }
        }
        @media (min-width: 768px) {
          #qr-reader {
            min-height: 400px !important;
          }
        }
      `;
      document.head.appendChild(styleElement);

      if (isMountedRef.current) {
        setIsScanning(true);
        setIsSwitchingCamera(false);
      }

      console.log('✅ Scanner started successfully');
    } catch (err) {
      console.error('Error starting scanner:', err);
      if (isMountedRef.current) {
        setError('Failed to start camera. Please check permissions.');
        setIsSwitchingCamera(false);
      }
    }
  };

  // Switch camera function
  const handleSwitchCamera = async () => {
    if (isSwitchingCamera) return;

    console.log('🔄 Switching camera from:', facingMode);
    setIsSwitchingCamera(true);
    setError(null);

    try {
      // Stop current scanner
      await stopScanner();

      // Toggle facing mode
      const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
      setFacingMode(newFacingMode);

      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 300));

      // Manually restart scanner with new facing mode
      if (!isMountedRef.current) return;

      console.log('Starting scanner with camera:', newFacingMode);

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: newFacingMode },
        {
          fps: 10,
          qrbox: function(viewfinderWidth, viewfinderHeight) {
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdgeSize * 0.7);
            return { width: qrboxSize, height: qrboxSize };
          },
          aspectRatio: 1.0,
        },
        // Success callback
        (decodedText) => {
          // Once a QR has been processed, ignore all further detections
          if (hasProcessedRef.current) return;

          console.log('📸 QR Code detected:', decodedText);
          hasProcessedRef.current = true;

          // Play beep sound
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 1200;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
          } catch (audioErr) {
            console.error('Audio error:', audioErr);
          }

          setScanSuccess(true);
          onScan(decodedText);

          // Automatically close scanner after successful scan
          setTimeout(() => {
            if (isMountedRef.current) {
              handleClose();
            }
          }, 500);
        },
        undefined
      );

      // Apply custom styles
      const existingStyle = document.getElementById('qr-scanner-custom-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      const styleElement = document.createElement('style');
      styleElement.id = 'qr-scanner-custom-styles';
      styleElement.textContent = `
        #qr-reader {
          position: relative !important;
          width: 100% !important;
          height: 100% !important;
          min-height: 200px !important;
        }
        #qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
        }
        #qr-reader__dashboard_section {
          display: none !important;
        }
        #qr-reader__camera_selection {
          display: none !important;
        }
        #qr-reader canvas {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
        }
        @media (max-width: 640px) {
          #qr-reader {
            min-height: 250px !important;
          }
        }
        @media (min-width: 641px) {
          #qr-reader {
            min-height: 300px !important;
          }
        }
        @media (min-width: 768px) {
          #qr-reader {
            min-height: 400px !important;
          }
        }
      `;
      document.head.appendChild(styleElement);

      if (isMountedRef.current) {
        setIsScanning(true);
        setIsSwitchingCamera(false);
      }

      console.log('✅ Camera switched successfully to:', newFacingMode);
    } catch (err) {
      console.error('❌ Error switching camera:', err);
      setError('Failed to switch camera. Please try again.');
      setIsSwitchingCamera(false);
    }
  };

  // Start scanner when component mounts only
  useEffect(() => {
    startScanner();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('Component unmounting, cleaning up...');
      isMountedRef.current = false;
      
      stopScanner().then(() => {
        // Remove custom styles
        const styleElement = document.getElementById('qr-scanner-custom-styles');
        if (styleElement) {
          styleElement.remove();
        }
      });
    };
  }, []);

  const handleClose = async () => {
    console.log('Closing QR scanner...');
    isMountedRef.current = false;
    
    // Stop scanner before closing
    await stopScanner();
    
    // Remove custom styles
    const styleElement = document.getElementById('qr-scanner-custom-styles');
    if (styleElement) {
      styleElement.remove();
    }
    
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 z-50"
        onClick={handleClose}
      />

      {/* Bottom Slider Popup - Fully Responsive */}
      <div 
        className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl sm:rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          maxHeight: 'min(95vh, calc(100vh - env(safe-area-inset-bottom)))',
        }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-2 pb-1 sm:pt-2.5 sm:pb-1.5 md:pt-3 md:pb-2 flex-shrink-0">
          <div className="w-10 h-1 sm:w-11 sm:h-1.5 md:w-12 md:h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header - Fully Responsive */}
        <div className="flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 md:px-6 md:py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">Scan QR Code</h2>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mt-0.5 truncate">Scan visitor or ICard QR code</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="rounded-full hover:bg-gray-100 h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 flex-shrink-0 touch-manipulation"
            aria-label="Close scanner"
          >
            <X className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5" />
          </Button>
        </div>

        {/* Content - Fully Responsive padding with proper overflow */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 pb-4 sm:pb-5 md:pb-6" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          {error ? (
            <div className="flex items-center justify-center min-h-[200px] sm:min-h-[250px] md:min-h-[300px]">
              <div className="text-center space-y-2 sm:space-y-3 md:space-y-4 px-4 w-full">
                <div className="text-4xl sm:text-5xl md:text-6xl">📷</div>
                <p className="text-red-600 font-medium text-xs sm:text-sm md:text-base px-2 sm:px-4 break-words">{error}</p>
                <Button 
                  onClick={() => startScanner()} 
                  className="text-xs sm:text-sm md:text-base h-9 sm:h-10 md:h-11 px-5 sm:px-6 md:px-8 touch-manipulation"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 md:space-y-5 w-full">
              {/* 1:1 Square QR Scanner - Fully Responsive with viewport constraints */}
              <div 
                className="relative w-full mx-auto bg-black rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden shadow-xl" 
                style={{ 
                  maxWidth: 'min(90vw, 400px)',
                  width: '100%',
                  aspectRatio: '1 / 1',
                  minHeight: '200px',
                }}
              >
                <div className="absolute inset-0 w-full h-full">
                  <div id="qr-reader" className="w-full h-full" />

                  {/* Switch Camera Button - Fully Responsive */}
                  <Button
                    onClick={handleSwitchCamera}
                    disabled={isSwitchingCamera}
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 bg-white/95 hover:bg-white text-gray-900 rounded-full shadow-lg z-10 h-8 px-3 sm:h-9 sm:px-3.5 md:h-10 md:px-4 text-xs sm:text-sm md:text-base touch-manipulation min-w-[44px] sm:min-w-[48px]"
                    size="sm"
                    aria-label="Switch camera"
                  >
                    <SwitchCamera className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline whitespace-nowrap">
                      {isSwitchingCamera ? 'Switching...' : facingMode === 'environment' ? 'Front' : 'Back'}
                    </span>
                  </Button>

                  {/* Success Overlay - Fully Responsive */}
                  {scanSuccess && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center z-20">
                      <div className="bg-white rounded-full p-3 sm:p-4 md:p-6 shadow-2xl">
                        <div className="text-3xl sm:text-4xl md:text-6xl">✅</div>
                      </div>
                    </div>
                  )}

                  {/* Corner Markers - Fully Responsive */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Top-left corner */}
                    <div className="absolute top-[8%] left-[8%] sm:top-[10%] sm:left-[10%] w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border-t-2 sm:border-t-3 md:border-t-4 border-l-2 sm:border-l-3 md:border-l-4 border-white rounded-tl-lg" />
                    {/* Top-right corner */}
                    <div className="absolute top-[8%] right-[8%] sm:top-[10%] sm:right-[10%] w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border-t-2 sm:border-t-3 md:border-t-4 border-r-2 sm:border-r-3 md:border-r-4 border-white rounded-tr-lg" />
                    {/* Bottom-left corner */}
                    <div className="absolute bottom-[8%] left-[8%] sm:bottom-[10%] sm:left-[10%] w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border-b-2 sm:border-b-3 md:border-b-4 border-l-2 sm:border-l-3 md:border-l-4 border-white rounded-bl-lg" />
                    {/* Bottom-right corner */}
                    <div className="absolute bottom-[8%] right-[8%] sm:bottom-[10%] sm:right-[10%] w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border-b-2 sm:border-b-3 md:border-b-4 border-r-2 sm:border-r-3 md:border-r-4 border-white rounded-br-lg" />
                  </div>
                </div>
              </div>

              {/* Instructions - Fully Responsive */}
              <div className="text-center space-y-1.5 sm:space-y-2 md:space-y-2.5 py-2 sm:py-3 md:py-4 px-3 sm:px-4">
                {scanSuccess ? (
                  <>
                    <p className="text-sm sm:text-base md:text-lg font-semibold text-green-600 break-words">
                      QR Code Scanned Successfully!
                    </p>
                    <p className="text-xs sm:text-sm md:text-base text-gray-500">Ready for next scan...</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 break-words">
                      Point camera at QR code
                    </p>
                    <p className="text-xs sm:text-sm md:text-base text-gray-500">
                      {isScanning ? '📸 Scanning...' : 'Starting camera...'}
                    </p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-400">
                      Position the QR code within the frame
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}