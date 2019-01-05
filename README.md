
# DirStamp  
Take stamps of directories with ease!  
  
## Usage  
`dirstamp path/`  
`dirstamp path/ -j > struct.json`  
  
> Validate current structure out of `.json` struct files with `dirstamp -c struct.json path/`  

## Options  
**-p** -- Switch sorting method from `shift` to `push`  
**-j** -- Print JSON  
**-s** -- Follow Symlinks  
**-d** -- Max depth (Defaults to Infinity [-1] )  
**-c** -- Read a JSON file and compare to current structure  
